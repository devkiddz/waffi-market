import type {
  ShoppingList,
  ShoppingListMutationResponse
} from '../shoppingListTypes';

type ShoppingListsResponse = {
  lists: ShoppingList[];
};

type ShoppingListErrorResponse = {
  error?: string;
};

export class ShoppingListRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ShoppingListRequestError';
  }
}

export type CreateShoppingListInput = {
  workspaceId: string;
  name: string;
  description?: string;
};

export type UpdateShoppingListInput = {
  workspaceId: string;

  name?: string;

  description?: string | null;

  status?: 'ACTIVE' | 'ARCHIVED';
};


export type UpdateShoppingListPublicationInput = {
  workspaceId: string;
  action: 'SUBMIT' | 'WITHDRAW';
};

export type AddShoppingListItemInput = {
  workspaceId: string;

  productId: string;
  variantId: string | null;

  quantity?: number;
  note?: string;
};

export type UpdateShoppingListItemInput = {
  workspaceId: string;

  quantity?: number;
  note?: string | null;
  position?: number;
};

async function readResponse<T>(
  response: Response
): Promise<T> {
  const data =
    (await response
      .json()
      .catch(() => null)) as
      | T
      | ShoppingListErrorResponse
      | null;

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'Unable to complete the shopping list request.';

    throw new ShoppingListRequestError(message, response.status);
  }

  return data as T;
}

export async function getShoppingLists(
  workspaceId: string
): Promise<ShoppingList[]> {
  const query =
    new URLSearchParams({
      workspaceId
    });

  const response =
    await fetch(
      `/api/shopping-lists?${query.toString()}`,
      {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',

        headers: {
          Accept: 'application/json'
        }
      }
    );

  const result =
    await readResponse<ShoppingListsResponse>(
      response
    );

  return result.lists;
}

export async function getApprovedPublicShoppingLists(
  workspaceId: string
): Promise<ShoppingList[]> {
  const query = new URLSearchParams({ workspaceId });
  const response = await fetch(`/api/shopping-lists/public?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  });
  const result = await readResponse<ShoppingListsResponse>(response);
  return result.lists;
}

export async function createShoppingList(
  input: CreateShoppingListInput
): Promise<ShoppingListMutationResponse> {
  const response =
    await fetch(
      '/api/shopping-lists',
      {
        method: 'POST',
        credentials: 'include',

        headers: {
          Accept: 'application/json',
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify(input)
      }
    );

  return readResponse<ShoppingListMutationResponse>(
    response
  );
}

export async function updateShoppingList(
  listId: string,
  input: UpdateShoppingListInput
): Promise<ShoppingListMutationResponse> {
  const response =
    await fetch(
      `/api/shopping-lists/${encodeURIComponent(listId)}`,
      {
        method: 'PATCH',
        credentials: 'include',

        headers: {
          Accept: 'application/json',
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify(input)
      }
    );

  return readResponse<ShoppingListMutationResponse>(
    response
  );
}

export async function updateShoppingListPublication(
  listId: string,
  input: UpdateShoppingListPublicationInput
): Promise<ShoppingListMutationResponse> {
  const response = await fetch(
    `/api/shopping-lists/${encodeURIComponent(listId)}/publication`,
    {
      method: 'POST',
      credentials: 'include',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(input)
    }
  );

  return readResponse<ShoppingListMutationResponse>(response);
}

export async function archiveShoppingList(
  listId: string,
  workspaceId: string
): Promise<ShoppingListMutationResponse> {
  const query =
    new URLSearchParams({
      workspaceId
    });

  const response =
    await fetch(
      `/api/shopping-lists/${encodeURIComponent(listId)}?${query.toString()}`,
      {
        method: 'DELETE',
        credentials: 'include',

        headers: {
          Accept: 'application/json'
        }
      }
    );

  return readResponse<ShoppingListMutationResponse>(
    response
  );
}

export async function addShoppingListItem(
  listId: string,
  input: AddShoppingListItemInput
): Promise<ShoppingListMutationResponse> {
  const response =
    await fetch(
      `/api/shopping-lists/${encodeURIComponent(listId)}/items`,
      {
        method: 'POST',
        credentials: 'include',

        headers: {
          Accept: 'application/json',
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify(input)
      }
    );

  return readResponse<ShoppingListMutationResponse>(
    response
  );
}

export async function updateShoppingListItem(
  listId: string,
  itemId: string,
  input: UpdateShoppingListItemInput
): Promise<ShoppingListMutationResponse> {
  const response =
    await fetch(
      `/api/shopping-lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',
        credentials: 'include',

        headers: {
          Accept: 'application/json',
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify(input)
      }
    );

  return readResponse<ShoppingListMutationResponse>(
    response
  );
}

export async function removeShoppingListItem(
  listId: string,
  itemId: string,
  workspaceId: string
): Promise<ShoppingListMutationResponse> {
  const query =
    new URLSearchParams({
      workspaceId
    });

  const response =
    await fetch(
      `/api/shopping-lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}?${query.toString()}`,
      {
        method: 'DELETE',
        credentials: 'include',

        headers: {
          Accept: 'application/json'
        }
      }
    );

  return readResponse<ShoppingListMutationResponse>(
    response
  );
}
