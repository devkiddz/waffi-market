import 'server-only';

import {
  createHash,
  randomUUID
} from 'node:crypto';

import type {
  Prisma
} from '@/lib/generated/prisma/client';

import {
  prisma
} from '@/lib/prisma';

import type {
  AIAssistantApplicationView,
  AIAssistantBridgeActionType,
  AIAssistantBridgeOptions,
  AIAssistantCampaignOptions,
  AIAssistantProductDraftOptions,
  AIAssistantProductRevisionOptions,
  AIAssistantResponsePayload,
  AIAssistantShoppingListOptions,
  AIAssistantTodoOptions
} from '../contracts';

import type {
  AssistantAccess
} from './assistantAccess';

import {
  mapApplication
} from './assistantMapper';

import {
  AssistantRuntimeError
} from './assistantRouteResponse';

type AssistantMessageRecord =
  Prisma.AiAssistantMessageGetPayload<{
    include: {
      session: true;
      applications: true;
    };
  }>;

function prismaAudience(
  audience:
    AssistantAccess['audience']
) {
  return audience.toUpperCase() as
    'CUSTOMER' |
    'ADMIN' |
    'VENDOR';
}

function cleanText(
  value: string,
  maximum:
    number
) {
  return value
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .slice(
      0,
      maximum
    );
}

function jsonObject(
  value:
    Prisma.JsonValue |
    null
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !==
      'object' ||
    Array.isArray(
      value
    )
  ) {
    return null;
  }

  return value as
    Record<string, unknown>;
}

function assistantPayload(
  message:
    AssistantMessageRecord
): AIAssistantResponsePayload {
  const payload =
    jsonObject(
      message.payload
    );

  if (!payload) {
    throw new AssistantRuntimeError(
      'This intelligence response does not contain an actionable structured payload.',
      422
    );
  }

  return payload as unknown as
    AIAssistantResponsePayload;
}

function stableOptions(
  actionType:
    AIAssistantBridgeActionType,
  options:
    AIAssistantBridgeOptions
) {
  const record = {
    ...options
  } as Record<string, unknown>;

  if (
    Array.isArray(
      record.productIds
    )
  ) {
    record.productIds =
      [
        ...new Set(
          record.productIds.filter(
            (
              value
            ): value is string =>
              typeof value ===
                'string' &&
              Boolean(
                value.trim()
              )
          )
        )
      ].sort();
  }

  return JSON.parse(
    JSON.stringify({
      actionType,
      options:
        record
    })
  ) as {
    actionType:
      AIAssistantBridgeActionType;
    options:
      Record<string, unknown>;
  };
}

function idempotencyKey(
  messageId:
    string,
  actionType:
    AIAssistantBridgeActionType,
  options:
    AIAssistantBridgeOptions
) {
  return createHash(
    'sha256'
  )
    .update(
      JSON.stringify({
        messageId,
        ...stableOptions(
          actionType,
          options
        )
      })
    )
    .digest(
      'hex'
    );
}

async function ownedMessage(
  access:
    AssistantAccess,
  messageId:
    string
): Promise<AssistantMessageRecord> {
  const message =
    await prisma.aiAssistantMessage.findFirst({
      where: {
        id:
          messageId,
        role:
          'ASSISTANT',
        session: {
          workspaceId:
            access.workspaceId,
          userId:
            access.userId,
          audience:
            prismaAudience(
              access.audience
            ),
          vendorProfileId:
            access.audience ===
            'vendor'
              ? access.vendorProfileId
              : null
        }
      },
      include: {
        session:
          true,
        applications:
          true
      }
    });

  if (!message) {
    throw new AssistantRuntimeError(
      'The selected intelligence response was not found.',
      404
    );
  }

  return message;
}

function requirePermission(
  access:
    AssistantAccess,
  permission:
    string
) {
  if (
    !access.permissions.has(
      permission
    )
  ) {
    throw new AssistantRuntimeError(
      `Missing required permission: ${permission}`,
      403
    );
  }
}

function payloadProducts(
  payload:
    AIAssistantResponsePayload
) {
  return new Map(
    payload.products.map(
      product => [
        product.id,
        product
      ]
    )
  );
}

function selectedProductIds(
  payload:
    AIAssistantResponsePayload,
  requested:
    string[]
) {
  const allowed =
    payloadProducts(
      payload
    );

  const selected =
    [
      ...new Set(
        requested
          .map(
            value =>
              value.trim()
          )
          .filter(
            value =>
              allowed.has(
                value
              )
          )
      )
    ];

  if (
    !selected.length
  ) {
    throw new AssistantRuntimeError(
      'Select at least one product from this intelligence response.',
      422
    );
  }

  return selected;
}

function draftFieldValue(
  payload:
    AIAssistantResponsePayload,
  label:
    string
) {
  return payload.draftFields.find(
    field =>
      field.label
        .toLowerCase() ===
      label.toLowerCase()
  )?.value ??
    null;
}

function resultPayload(
  input: {
    label:
      string;
    href:
      string;
    detail?:
      Record<string, unknown>;
  }
): Prisma.InputJsonValue {
  return {
    label:
      input.label,
    href:
      input.href,
    ...(
      input.detail ??
      {}
    )
  } as Prisma.InputJsonValue;
}

async function createPendingApplication(
  access:
    AssistantAccess,
  message:
    AssistantMessageRecord,
  actionType:
    AIAssistantBridgeActionType,
  options:
    AIAssistantBridgeOptions
) {
  const key =
    idempotencyKey(
      message.id,
      actionType,
      options
    );

  const existing =
    await prisma.aiAssistantApplication.findUnique({
      where: {
        idempotencyKey:
          key
      }
    });

  if (
    existing?.status ===
    'APPLIED'
  ) {
    return {
      application:
        existing,
      alreadyApplied:
        true
    };
  }

  if (existing) {
    const reset =
      await prisma.aiAssistantApplication.update({
        where: {
          id:
            existing.id
        },
        data: {
          status:
            'PENDING',
          requestPayload:
            stableOptions(
              actionType,
              options
            ) as Prisma.InputJsonValue,
          resultPayload:
            undefined,
          targetType:
            null,
          targetId:
            null,
          error:
            null,
          appliedAt:
            null
        }
      });

    return {
      application:
        reset,
      alreadyApplied:
        false
    };
  }

  const application =
    await prisma.aiAssistantApplication.create({
      data: {
        messageId:
          message.id,
        workspaceId:
          access.workspaceId,
        userId:
          access.userId,
        vendorProfileId:
          access.vendorProfileId,
        actionType,
        status:
          'PENDING',
        idempotencyKey:
          key,
        requestPayload:
          stableOptions(
            actionType,
            options
          ) as Prisma.InputJsonValue
      }
    });

  return {
    application,
    alreadyApplied:
      false
  };
}

async function failApplication(
  applicationId:
    string,
  error:
    unknown
) {
  const message =
    error instanceof
    Error
      ? error.message
      : 'The intelligence action could not be applied.';

  await prisma.aiAssistantApplication.update({
    where: {
      id:
        applicationId
    },
    data: {
      status:
        'FAILED',
      error:
        message.slice(
          0,
          2000
        )
    }
  }).catch(
    () =>
      undefined
  );
}

async function nextShoppingListName(
  workspaceId:
    string,
  userId:
    string,
  requested:
    string
) {
  const base =
    cleanText(
      requested,
      90
    ) ||
    'AJ Intelligence Plan';

  for (
    let index =
      0;
    index <
    100;
    index +=
      1
  ) {
    const name =
      index ===
      0
        ? base
        : `${base} (${index + 1})`;

    const exists =
      await prisma.shoppingList.findUnique({
        where: {
          workspaceId_userId_name: {
            workspaceId,
            userId,
            name
          }
        },
        select: {
          id:
            true
        }
      });

    if (!exists) {
      return name;
    }
  }

  return `${base} ${Date.now()}`;
}

async function applyShoppingList(
  access:
    AssistantAccess,
  message:
    AssistantMessageRecord,
  payload:
    AIAssistantResponsePayload,
  applicationId:
    string,
  options:
    AIAssistantShoppingListOptions
) {
  if (
    access.audience !==
    'customer'
  ) {
    throw new AssistantRuntimeError(
      'Shopping List application is available only to the customer intelligence runtime.',
      403
    );
  }

  const ids =
    selectedProductIds(
      payload,
      options.productIds
    );

  const liveProducts =
    await prisma.product.findMany({
      where: {
        id: {
          in:
            ids
        },
        workspaceId:
          access.workspaceId,
        active:
          true,
        status:
          'PUBLISHED'
      },
      include: {
        variants: {
          where: {
            active:
              true
          },
          orderBy: {
            position:
              'asc'
          },
          include: {
            inventory:
              true
          }
        }
      }
    });

  const payloadById =
    payloadProducts(
      payload
    );

  const prepared =
    liveProducts.flatMap(
      product => {
        const suggestedVariantId =
          payloadById.get(
            product.id
          )?.variantId ??
          null;

        const variant =
          product.variants.find(
            item =>
              item.id ===
                suggestedVariantId &&
              (
                item.inventory
                  ?.quantity ??
                0
              ) -
                (
                  item.inventory
                    ?.reserved ??
                  0
                ) >
                0
          ) ??
          product.variants.find(
            item =>
              (
                item.inventory
                  ?.quantity ??
                0
              ) -
                (
                  item.inventory
                    ?.reserved ??
                  0
                ) >
              0
          ) ??
          null;

        return variant
          ? [
              {
                product,
                variant
              }
            ]
          : [];
      }
    );

  if (
    !prepared.length
  ) {
    throw new AssistantRuntimeError(
      'None of the selected products currently has an available active variant.',
      409
    );
  }

  const name =
    await nextShoppingListName(
      access.workspaceId,
      access.userId,
      options.title
    );

  const description =
    cleanText(
      options.description ??
      payload.summary,
      500
    );

  const result =
    await prisma.$transaction(
      async tx => {
        const list =
          await tx.shoppingList.create({
            data: {
              workspaceId:
                access.workspaceId,
              userId:
                access.userId,
              name,
              description:
                description ||
                null,
              visibility:
                'PRIVATE',
              status:
                'ACTIVE',
              publicationStatus:
                'PRIVATE'
            }
          });

        await tx.shoppingListItem.createMany({
          data:
            prepared.map(
              (
                item,
                index
              ) => ({
                shoppingListId:
                  list.id,
                productId:
                  item.product.id,
                variantId:
                  item.variant.id,
                quantity:
                  1,
                position:
                  index,
                note:
                  'Added from an accepted AJ Intelligence plan.'
              })
            )
        });

        await tx.experienceEvent.create({
          data: {
            workspaceId:
              access.workspaceId,
            userId:
              access.userId,
            type:
              'SHOPPING_LIST_CREATED',
            source:
              'ai-assistant',
            metadata: {
              shoppingListId:
                list.id,
              assistantMessageId:
                message.id,
              assistantApplicationId:
                applicationId,
              productCount:
                prepared.length
            }
          }
        });

        await tx.experienceEvent.createMany({
          data:
            prepared.map(
              item => ({
                workspaceId:
                  access.workspaceId,
                userId:
                  access.userId,
                type:
                  'ADD_TO_SHOPPING_LIST' as const,
                source:
                  'ai-assistant',
                productId:
                  item.product.id,
                metadata: {
                  shoppingListId:
                    list.id,
                  variantId:
                    item.variant.id,
                  assistantApplicationId:
                    applicationId
                }
              })
            )
        });

        const href =
          '/account/lists';

        const application =
          await tx.aiAssistantApplication.update({
            where: {
              id:
                applicationId
            },
            data: {
              status:
                'APPLIED',
              targetType:
                'SHOPPING_LIST',
              targetId:
                list.id,
              resultPayload:
                resultPayload({
                  label:
                    `Created ${list.name}`,
                  href,
                  detail: {
                    shoppingListId:
                      list.id,
                    productCount:
                      prepared.length
                  }
                }),
              appliedAt:
                new Date()
            }
          });

        await tx.aiAssistantMessage.update({
          where: {
            id:
              message.id
          },
          data: {
            feedback:
              'APPLIED'
          }
        });

        await tx.aiAssistantSession.update({
          where: {
            id:
              message.sessionId
          },
          data: {
            updatedAt:
              new Date()
          }
        });

        return application;
      }
    );

  return mapApplication(
    result
  );
}

async function applyAdminTodo(
  access:
    AssistantAccess,
  message:
    AssistantMessageRecord,
  payload:
    AIAssistantResponsePayload,
  applicationId:
    string,
  options:
    AIAssistantTodoOptions
) {
  if (
    access.audience !==
    'admin'
  ) {
    throw new AssistantRuntimeError(
      'Admin Todo creation is available only to the administrator intelligence runtime.',
      403
    );
  }

  requirePermission(
    access,
    'todo:manage'
  );

  const title =
    cleanText(
      options.title,
      180
    ) ||
    cleanText(
      payload.headline,
      180
    );

  const description =
    cleanText(
      options.description ??
      payload.summary,
      1800
    );

  const priority =
    [
      'LOW',
      'MEDIUM',
      'HIGH',
      'URGENT'
    ].includes(
      options.priority
    )
      ? options.priority
      : 'MEDIUM';

  const result =
    await prisma.$transaction(
      async tx => {
        const todo =
          await tx.adminTodo.create({
            data: {
              workspaceId:
                access.workspaceId,
              createdById:
                access.userId,
              title,
              description:
                description ||
                null,
              source:
                'AI',
              priority,
              status:
                'OPEN',
              targetType:
                'WORKSPACE',
              targetId:
                access.workspaceId,
              dedupeKey:
                `ai-assistant:${applicationId}`,
              activeDedupeKey:
                `ai-assistant:${applicationId}`,
              metadata: {
                assistantMessageId:
                  message.id,
                assistantApplicationId:
                  applicationId,
                outputType:
                  payload.outputType,
                headline:
                  payload.headline
              }
            }
          });

        await tx.adminAuditEvent.create({
          data: {
            workspaceId:
              access.workspaceId,
            actorId:
              access.userId,
            action:
              'AI_ASSISTANT_TODO_CREATED',
            targetType:
              'OTHER',
            targetId:
              todo.id,
            summary:
              `AJ Intelligence Todo created: ${todo.title}.`,
            metadata: {
              assistantMessageId:
                message.id,
              assistantApplicationId:
                applicationId,
              todoId:
                todo.id,
              priority
            }
          }
        });

        const application =
          await tx.aiAssistantApplication.update({
            where: {
              id:
                applicationId
            },
            data: {
              status:
                'APPLIED',
              targetType:
                'OTHER',
              targetId:
                todo.id,
              resultPayload:
                resultPayload({
                  label:
                    `Created Todo: ${todo.title}`,
                  href:
                    '/admin/todos',
                  detail: {
                    todoId:
                      todo.id,
                    priority
                  }
                }),
              appliedAt:
                new Date()
            }
          });

        await tx.aiAssistantMessage.update({
          where: {
            id:
              message.id
          },
          data: {
            feedback:
              'APPLIED'
          }
        });

        await tx.aiAssistantSession.update({
          where: {
            id:
              message.sessionId
          },
          data: {
            updatedAt:
              new Date()
          }
        });

        return application;
      }
    );

  return mapApplication(
    result
  );
}


function productSlug(
  value:
    string
) {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /(^-|-$)/g,
      ''
    );
}

async function availableProductSlug(
  workspaceId:
    string,
  requested:
    string
) {
  const base =
    productSlug(
      requested
    ) ||
    `product-${Date.now()}`;

  for (
    let index =
      0;
    index <
    100;
    index +=
      1
  ) {
    const slug =
      index ===
      0
        ? base
        : `${base}-${index + 1}`;

    const existing =
      await prisma.product.findUnique({
        where: {
          workspaceId_slug: {
            workspaceId,
            slug
          }
        },
        select: {
          id:
            true
        }
      });

    if (!existing) {
      return slug;
    }
  }

  return `${base}-${Date.now()}`;
}

async function applyProductDraft(
  access:
    AssistantAccess,
  message:
    AssistantMessageRecord,
  payload:
    AIAssistantResponsePayload,
  applicationId:
    string,
  options:
    AIAssistantProductDraftOptions
) {
  if (
    access.audience ===
    'customer'
  ) {
    throw new AssistantRuntimeError(
      'Product creation is available only to administrator and vendor assistants.',
      403
    );
  }

  requirePermission(
    access,
    access.audience ===
      'vendor'
      ? 'product:manage'
      : 'product:create'
  );

  const recognised =
    payload.productDraft;

  if (!recognised) {
    throw new AssistantRuntimeError(
      'This response does not contain a recognised Product draft. Ask Shelsea to create a Product and include its exact name and category.',
      422
    );
  }

  const name =
    cleanText(
      options.name ||
      recognised.name,
      160
    );

  if (
    name.length <
    2
  ) {
    throw new AssistantRuntimeError(
      'A clear Product name is required.',
      422
    );
  }

  const [
    category,
    subcategory,
    brand
  ] =
    await Promise.all([
      prisma.category.findFirst({
        where: {
          id:
            recognised.categoryId,
          active:
            true
        },
        select: {
          id:
            true,
          label:
            true
        }
      }),
      recognised.subcategoryId
        ? prisma.subcategory.findFirst({
            where: {
              id:
                recognised.subcategoryId,
              categoryId:
                recognised.categoryId,
              active:
                true
            },
            select: {
              id:
                true,
              label:
                true
            }
          })
        : null,
      recognised.brandId
        ? prisma.brand.findFirst({
            where: {
              id:
                recognised.brandId,
              active:
                true
            },
            select: {
              id:
                true,
              name:
                true
            }
          })
        : null
    ]);

  if (!category) {
    throw new AssistantRuntimeError(
      'The recognised Product category is no longer available. Ask Shelsea to recognise the Product again.',
      409
    );
  }

  if (
    recognised.subcategoryId &&
    !subcategory
  ) {
    throw new AssistantRuntimeError(
      'The recognised Product subcategory is no longer available.',
      409
    );
  }

  if (
    recognised.brandId &&
    !brand
  ) {
    throw new AssistantRuntimeError(
      'The recognised Product brand is no longer available.',
      409
    );
  }

  if (
    access.audience ===
      'vendor' &&
    !access.vendorProfileId
  ) {
    throw new AssistantRuntimeError(
      'An active Vendor Profile is required.',
      403
    );
  }

  const slug =
    await availableProductSlug(
      access.workspaceId,
      name
    );

  const shortDescription =
    cleanText(
      options.shortDescription ||
      recognised.shortDescription,
      500
    );

  const longDescription =
    cleanText(
      options.longDescription ||
      recognised.longDescription,
      4000
    );

  const estimatedDelivery =
    cleanText(
      options.estimatedDelivery ??
      recognised.estimatedDelivery ??
      '',
      180
    );

  const tags =
    [
      ...new Set(
        (
          options.tags.length
            ? options.tags
            : recognised.tags
        )
          .map(
            value =>
              cleanText(
                value,
                60
              ).toLowerCase()
          )
          .filter(
            Boolean
          )
      )
    ].slice(
      0,
      20
    );

  const result =
    await prisma.$transaction(
      async tx => {
        const product =
          await tx.product.create({
            data: {
              id:
                randomUUID(),
              workspaceId:
                access.workspaceId,
              vendorProfileId:
                access.audience ===
                'vendor'
                  ? access.vendorProfileId
                  : null,
              name,
              slug,
              categoryId:
                category.id,
              subcategoryId:
                subcategory?.id ??
                null,
              brandId:
                brand?.id ??
                null,
              shortDescription:
                shortDescription ||
                null,
              longDescription:
                longDescription ||
                null,
              estimatedDelivery:
                estimatedDelivery ||
                null,
              tags,
              active:
                false,
              featured:
                false,
              isNew:
                true,
              status:
                'DRAFT',
              discountPercentage:
                0
            }
          });

        await tx.adminAuditEvent.create({
          data: {
            workspaceId:
              access.workspaceId,
            actorId:
              access.userId,
            action:
              'AI_PRODUCT_DRAFT_CREATED',
            targetType:
              'PRODUCT',
            targetId:
              product.id,
            summary:
              `AJ Assistant created an inactive Product draft for ${product.name}.`,
            metadata: {
              assistantMessageId:
                message.id,
              assistantApplicationId:
                applicationId,
              audience:
                access.audience,
              categoryId:
                category.id,
              categoryLabel:
                category.label,
              subcategoryId:
                subcategory?.id ??
                null,
              subcategoryLabel:
                subcategory?.label ??
                null,
              brandId:
                brand?.id ??
                null,
              brandName:
                brand?.name ??
                null,
              recognitionConfidence:
                recognised.recognitionConfidence,
              assumptions:
                recognised.assumptions
            }
          }
        });

        const href =
          access.audience ===
          'admin'
            ? `/admin/products/${product.id}`
            : `/vendor/products/${product.id}`;

        const application =
          await tx.aiAssistantApplication.update({
            where: {
              id:
                applicationId
            },
            data: {
              status:
                'APPLIED',
              targetType:
                'PRODUCT',
              targetId:
                product.id,
              resultPayload:
                resultPayload({
                  label:
                    `Product draft created: ${product.name}`,
                  href,
                  detail: {
                    productId:
                      product.id,
                    productStatus:
                      'DRAFT',
                    active:
                      false,
                    categoryId:
                      category.id,
                    vendorProfileId:
                      access.audience ===
                      'vendor'
                        ? access.vendorProfileId
                        : null
                  }
                }),
              appliedAt:
                new Date()
            }
          });

        await tx.aiAssistantMessage.update({
          where: {
            id:
              message.id
          },
          data: {
            feedback:
              'APPLIED'
          }
        });

        await tx.aiAssistantSession.update({
          where: {
            id:
              message.sessionId
          },
          data: {
            updatedAt:
              new Date()
          }
        });

        return application;
      }
    );

  return mapApplication(
    result
  );
}

async function applyProductRevision(
  access:
    AssistantAccess,
  message:
    AssistantMessageRecord,
  payload:
    AIAssistantResponsePayload,
  applicationId:
    string,
  options:
    AIAssistantProductRevisionOptions
) {
  if (
    access.audience ===
    'customer'
  ) {
    throw new AssistantRuntimeError(
      'Product revision proposals are not available to the customer intelligence runtime.',
      403
    );
  }

  requirePermission(
    access,
    access.audience ===
      'vendor'
      ? 'product:manage'
      : 'product:update'
  );

  const allowedProducts =
    payloadProducts(
      payload
    );

  if (
    !allowedProducts.has(
      options.productId
    )
  ) {
    throw new AssistantRuntimeError(
      'Select a Product included in this intelligence response.',
      422
    );
  }

  const product =
    await prisma.product.findFirst({
      where: {
        id:
          options.productId,
        workspaceId:
          access.workspaceId,
        ...(access.audience ===
        'vendor'
          ? {
              vendorProfileId:
                access.vendorProfileId
            }
          : {})
      },
      include: {
        category: {
          select: {
            id:
              true,
            slug:
              true,
            label:
              true
          }
        },
        brand: {
          select: {
            id:
              true,
            slug:
              true,
            name:
              true
          }
        }
      }
    });

  if (!product) {
    throw new AssistantRuntimeError(
      'The selected Product is outside this intelligence authority.',
      404
    );
  }

  const reason =
    cleanText(
      options.reason,
      1000
    ) ||
    `Review the AJ Intelligence recommendations for ${product.name}.`;

  const generatedTags =
    [
      ...new Set(
        [
          ...product.tags,
          product.category.slug,
          product.brand?.slug ??
            null,
          ...product.name
            .toLowerCase()
            .split(
              /[^a-z0-9]+/
            )
            .filter(
              value =>
                value.length >
                2
            )
        ].filter(
          (
            value
          ): value is string =>
            Boolean(
              value
            )
        )
      )
    ].slice(
      0,
      16
    );

  const deterministicDraft = [
    {
      label:
        'Product title',
      value:
        product.name
    },
    {
      label:
        'Short description',
      value:
        product.shortDescription?.trim() ||
        `${product.name} is a ${product.category.label.toLowerCase()} selection${product.brand ? ` from ${product.brand.name}` : ''}, prepared for clear discovery and confident purchase decisions.`
    },
    {
      label:
        'Long description',
      value:
        product.longDescription?.trim() ||
        `${product.name} belongs to the ${product.category.label} catalog${product.brand ? ` and is supplied under ${product.brand.name}` : ''}. Review its active variants, media, availability and intended use before publishing this proposed description.`
    },
    {
      label:
        'Search tags',
      value:
        generatedTags.join(
          ', '
        )
    }
  ];

  const proposedFields =
    payload.draftFields.length
      ? [
          ...payload.draftFields.map(
            field => ({
              label:
                field.label,
              value:
                field.value
            })
          ),
          ...deterministicDraft
        ]
      : deterministicDraft;

  const productInsight =
    allowedProducts.get(
      product.id
    );

  const result =
    await prisma.$transaction(
      async tx => {
        const request =
          await tx.adminApprovalRequest.create({
            data: {
              workspaceId:
                access.workspaceId,
              requestedById:
                access.userId,
              source:
                access.audience ===
                'vendor'
                  ? 'VENDOR'
                  : 'ADMIN',
              priority:
                'NORMAL',
              action:
                'OTHER',
              targetType:
                'PRODUCT',
              targetId:
                product.id,
              reason,
              payload: {
                assistantMessageId:
                  message.id,
                assistantApplicationId:
                  applicationId,
                outputType:
                  payload.outputType,
                headline:
                  payload.headline,
                summary:
                  payload.summary,
                productReason:
                  productInsight?.reason ??
                  null,
                proposedFields,
                sections:
                  payload.sections
              },
              targetSnapshot: {
                id:
                  product.id,
                name:
                  product.name,
                slug:
                  product.slug,
                shortDescription:
                  product.shortDescription,
                longDescription:
                  product.longDescription,
                tags:
                  product.tags,
                category:
                  product.category,
                brand:
                  product.brand,
                status:
                  product.status,
                active:
                  product.active,
                updatedAt:
                  product.updatedAt.toISOString()
              }
            }
          });

        await tx.adminApprovalEvent.create({
          data: {
            workspaceId:
              access.workspaceId,
            requestId:
              request.id,
            actorId:
              access.userId,
            type:
              'CREATED',
            toStatus:
              'PENDING',
            note:
              'Created from an explicitly accepted AJ Intelligence Product revision proposal.',
            metadata: {
              assistantMessageId:
                message.id,
              assistantApplicationId:
                applicationId
            }
          }
        });

        await tx.adminAuditEvent.create({
          data: {
            workspaceId:
              access.workspaceId,
            actorId:
              access.userId,
            action:
              'AI_PRODUCT_REVISION_SUBMITTED',
            targetType:
              'PRODUCT',
            targetId:
              product.id,
            summary:
              `AI-assisted Product revision proposal submitted for ${product.name}.`,
            metadata: {
              approvalRequestId:
                request.id,
              assistantMessageId:
                message.id,
              assistantApplicationId:
                applicationId,
              audience:
                access.audience
            }
          }
        });

        const application =
          await tx.aiAssistantApplication.update({
            where: {
              id:
                applicationId
            },
            data: {
              status:
                'APPLIED',
              targetType:
                'PRODUCT',
              targetId:
                product.id,
              resultPayload:
                resultPayload({
                  label:
                    `Submitted ${product.name} for review`,
                  href:
                    access.audience ===
                    'vendor'
                      ? '/vendor/submissions'
                      : '/admin/approvals',
                  detail: {
                    productId:
                      product.id,
                    approvalRequestId:
                      request.id
                  }
                }),
              appliedAt:
                new Date()
            }
          });

        await tx.aiAssistantMessage.update({
          where: {
            id:
              message.id
          },
          data: {
            feedback:
              'APPLIED'
          }
        });

        await tx.aiAssistantSession.update({
          where: {
            id:
              message.sessionId
          },
          data: {
            updatedAt:
              new Date()
          }
        });

        return application;
      }
    );

  return mapApplication(
    result
  );
}

async function applyCampaignDraft(
  access:
    AssistantAccess,
  message:
    AssistantMessageRecord,
  payload:
    AIAssistantResponsePayload,
  applicationId:
    string,
  options:
    AIAssistantCampaignOptions
) {
  if (
    access.audience ===
    'customer'
  ) {
    throw new AssistantRuntimeError(
      'Campaign draft creation is not available to the customer intelligence runtime.',
      403
    );
  }

  requirePermission(
    access,
    access.audience ===
      'vendor'
      ? 'campaign:manage'
      : 'experience:manage'
  );

  const ids =
    options.productIds.length
      ? selectedProductIds(
          payload,
          options.productIds
        )
      : payload.products.map(
          product =>
            product.id
        );

  const products =
    ids.length
      ? await prisma.product.findMany({
          where: {
            id: {
              in:
                ids
            },
            workspaceId:
              access.workspaceId,
            active:
              true,
            status:
              'PUBLISHED',
            ...(access.audience ===
            'vendor'
              ? {
                  vendorProfileId:
                    access.vendorProfileId
                }
              : {})
          },
          select: {
            id:
              true,
            name:
              true
          }
        })
      : [];

  const title =
    cleanText(
      options.title,
      180
    ) ||
    cleanText(
      draftFieldValue(
        payload,
        'Campaign title'
      ) ??
      payload.headline,
      180
    );

  const baseDescription =
    cleanText(
      options.description ??
      draftFieldValue(
        payload,
        'Description'
      ) ??
      payload.summary,
      900
    );

  const productLine =
    products.length
      ? `Suggested products: ${products.map(
          product =>
            product.name
        ).join(', ')}.`
      : '';

  const description =
    cleanText(
      [
        baseDescription,
        productLine
      ]
        .filter(
          Boolean
        )
        .join(
          '\n\n'
        ),
      1200
    );

  const campaignType =
    [
      'BANNER',
      'STORY',
      'REEL'
    ].includes(
      options.campaignType
    )
      ? options.campaignType
      : 'BANNER';

  const result =
    await prisma.$transaction(
      async tx => {
        const campaign =
          await tx.storeStudioCampaign.create({
            data: {
              workspaceId:
                access.workspaceId,
              vendorId:
                access.audience ===
                'vendor'
                  ? access.userId
                  : null,
              vendorProfileId:
                access.audience ===
                'vendor'
                  ? access.vendorProfileId
                  : null,
              type:
                campaignType,
              status:
                'DRAFT',
              placementTier:
                'STANDARD',
              title,
              description:
                description ||
                null,
              requestedPriority:
                0,
              adminWeight:
                0,
              active:
                true
            }
          });

        await tx.adminAuditEvent.create({
          data: {
            workspaceId:
              access.workspaceId,
            actorId:
              access.userId,
            action:
              'AI_CAMPAIGN_DRAFT_CREATED',
            targetType:
              'CAMPAIGN',
            targetId:
              campaign.id,
            summary:
              `AI-assisted ${campaignType.toLowerCase()} campaign draft created: ${campaign.title}.`,
            metadata: {
              assistantMessageId:
                message.id,
              assistantApplicationId:
                applicationId,
              campaignId:
                campaign.id,
              audience:
                access.audience,
              productIds:
                products.map(
                  product =>
                    product.id
                ),
              productNames:
                products.map(
                  product =>
                    product.name
                )
            }
          }
        });

        const href =
          access.audience ===
          'admin'
            ? '/admin/store-studio'
            : campaignType ===
              'REEL'
              ? '/vendor/reels'
              : campaignType ===
                'STORY'
                ? '/vendor/stories'
                : '/vendor/submissions';

        const application =
          await tx.aiAssistantApplication.update({
            where: {
              id:
                applicationId
            },
            data: {
              status:
                'APPLIED',
              targetType:
                'CAMPAIGN',
              targetId:
                campaign.id,
              resultPayload:
                resultPayload({
                  label:
                    `Created draft: ${campaign.title}`,
                  href,
                  detail: {
                    campaignId:
                      campaign.id,
                    campaignType,
                    productIds:
                      products.map(
                        product =>
                          product.id
                      )
                  }
                }),
              appliedAt:
                new Date()
            }
          });

        await tx.aiAssistantMessage.update({
          where: {
            id:
              message.id
          },
          data: {
            feedback:
              'APPLIED'
          }
        });

        await tx.aiAssistantSession.update({
          where: {
            id:
              message.sessionId
          },
          data: {
            updatedAt:
              new Date()
          }
        });

        return application;
      }
    );

  return mapApplication(
    result
  );
}

export async function applyAssistantAction(
  access:
    AssistantAccess,
  input: {
    messageId:
      string;
    actionType:
      AIAssistantBridgeActionType;
    options:
      AIAssistantBridgeOptions;
  }
): Promise<AIAssistantApplicationView> {
  const message =
    await ownedMessage(
      access,
      input.messageId
    );

  const payload =
    assistantPayload(
      message
    );

  const {
    application,
    alreadyApplied
  } =
    await createPendingApplication(
      access,
      message,
      input.actionType,
      input.options
    );

  if (alreadyApplied) {
    return mapApplication(
      application
    );
  }

  try {
    switch (
      input.actionType
    ) {
      case 'SHOPPING_LIST_CREATE':
        return await applyShoppingList(
          access,
          message,
          payload,
          application.id,
          input.options as
            AIAssistantShoppingListOptions
        );

      case 'ADMIN_TODO_CREATE':
        return await applyAdminTodo(
          access,
          message,
          payload,
          application.id,
          input.options as
            AIAssistantTodoOptions
        );

      case 'PRODUCT_DRAFT_CREATE':
        return await applyProductDraft(
          access,
          message,
          payload,
          application.id,
          input.options as
            AIAssistantProductDraftOptions
        );

      case 'PRODUCT_REVISION_SUBMIT':
        return await applyProductRevision(
          access,
          message,
          payload,
          application.id,
          input.options as
            AIAssistantProductRevisionOptions
        );

      case 'CAMPAIGN_DRAFT_CREATE':
        return await applyCampaignDraft(
          access,
          message,
          payload,
          application.id,
          input.options as
            AIAssistantCampaignOptions
        );
    }
  } catch (
    error
  ) {
    await failApplication(
      application.id,
      error
    );

    throw error;
  }
}
