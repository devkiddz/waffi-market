import type { ExperienceTarget } from '@/features/feed-experience';

import type {
  FeedContext,
  FeedIntent
} from '@/features/feed-experience/contracts';

// ============================================================
// EXTENSIBLE DISCOVERY IDENTIFIERS
// ============================================================

export type DiscoveryGroupId = string;

export type DiscoveryWidgetId = string;

export type DiscoveryComponentKey = string;

export type DiscoveryIconKey = string;

export type DiscoveryPageMode = string;

export type DiscoveryIntentType = string;

export type DiscoverySignalKey = string;

// ============================================================
// CURRENT HUB COMPATIBILITY IDENTIFIERS
// ============================================================

export type HubGroupId = DiscoveryGroupId;

export type HubWidgetId = DiscoveryWidgetId;

// ============================================================
// HUB PRESENTATION TYPES
// ============================================================

export type HubWidgetLayout =
  | 'hero'
  | 'slider'
  | 'grid'
  | 'minimal-grid'
  | 'tracking'
  | 'summary'
  | 'membership';

export type HubWidgetSize =
  | 'sm'
  | 'md'
  | 'lg';

export type HubWidgetStatus =
  | 'idle'
  | 'active'
  | 'warning'
  | 'success';

export type HubPreviewMode =
  | 'inline'
  | 'modal'
  | 'feed';

export type HubAction = {
  label: string;
  href?: string;
  target?: ExperienceTarget;
};

export type HubStat = {
  label: string;
  value: string | number;
  helper?: string;
};

export type HubSlideItem = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  price?: number;
  badge?: string;
  href?: string;
  target?: ExperienceTarget;
};

export type HubVisual = {
  image: string;
  alt?: string;
};

export type HubProgress = {
  label: string;
  value: number;
  helper?: string;
};

export type HubTimelineItem = {
  id: string;
  label: string;
  description?: string;
  completed?: boolean;
  active?: boolean;
  time?: string;
};

export type HubCondition = {
  label: string;
  value: string;
};

export type HubLocation = {
  title: string;
  subtitle?: string;
  mapImage?: string;

  coordinates?: {
    lat: number;
    lng: number;
  };
};

export type HubWidget = {
  id: HubWidgetId;
  groupId: HubGroupId;

  /**
   * Connects a resolved widget to a custom runtime component.
   *
   * The widget ID describes the experience capability.
   * The component key describes how that capability is rendered.
   */
  componentKey?: DiscoveryComponentKey;

  title: string;
  description?: string;

  order: number;
  enabled: boolean;

  size?: HubWidgetSize;
  status?: HubWidgetStatus;

  badge?: string | number;
  meta?: string;

  image?: string;
  visual?: HubVisual;

  accent?: string;

  stats?: HubStat[];

  slides?: HubSlideItem[];
  autoSlide?: boolean;

  progress?: HubProgress;

  timeline?: HubTimelineItem[];

  conditions?: HubCondition[];

  location?: HubLocation;

  insight?: string;

  action?: HubAction;
  actions?: HubAction[];

  layout?: HubWidgetLayout;
};

/**
 * Icons are registry keys rather than a closed union.
 *
 * Current Shelsea keys still work, while future RCENTZ
 * blueprints may register new icons without changing this type.
 */
export type HubGroupIcon = DiscoveryIconKey;

export type HubGroupIndicator =
  | 'dot'
  | 'new'
  | 'live'
  | 'spark';

export type HubGroup = {
  id: HubGroupId;
  label: string;
  icon: HubGroupIcon;

  description?: string;

  order: number;

  indicator?: HubGroupIndicator;
};

export type HubPreview = {
  widgetId: HubWidgetId;

  title: string;
  description?: string;

  mode: HubPreviewMode;

  image?: string;

  action?: HubAction;
};

export type HubContextValue = {
  groups: HubGroup[];
  widgets: HubWidget[];

  activeGroupId: HubGroupId;

  activePreview: HubPreview | null;

  setActiveGroupId: (
    groupId: HubGroupId
  ) => void;

  openPreview: (
    preview: HubPreview
  ) => void;

  closePreview: () => void;
};

// ============================================================
// COMPACT DISCOVERY TYPES
// ============================================================

export type CompactDiscoveryItemIcon = DiscoveryIconKey;

export type CompactDiscoveryItemTone =
  | 'default'
  | 'primary'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose';

export type CompactDiscoveryItem = {
  id: string;

  label: string;
  value: string;

  description?: string;

  icon: CompactDiscoveryItemIcon;
  tone: CompactDiscoveryItemTone;

  priority: number;

  groupId?: HubGroupId;

  widgetId?: HubWidgetId;

  active?: boolean;
};

// ============================================================
// DISCOVERY REGISTRY RULES
// ============================================================

export type DiscoveryEligibilityRules = {
  enabled?: boolean;

  requiresAuthentication?: boolean;

  supportedPageModes?: DiscoveryPageMode[];

  excludedPageModes?: DiscoveryPageMode[];

  supportedIntentTypes?: DiscoveryIntentType[];

  excludedIntentTypes?: DiscoveryIntentType[];

  /**
   * Every listed signal must be available.
   */
  requiredSignals?: DiscoverySignalKey[];

  /**
   * At least one listed signal must be available.
   */
  anySignals?: DiscoverySignalKey[];
};

export type DiscoveryPagePriorityMap = Partial<
  Record<
    DiscoveryPageMode,
    number
  >
>;

export type DiscoveryIntentPriorityMap = Partial<
  Record<
    DiscoveryIntentType,
    number
  >
>;

// ============================================================
// DISCOVERY REGISTRY DEFINITIONS
// ============================================================

export type DiscoveryGroupDefinition = {
  id: DiscoveryGroupId;

  label: string;
  description?: string;

  iconKey: DiscoveryIconKey;

  defaultPriority: number;

  pagePriority?: DiscoveryPagePriorityMap;

  intentPriority?: DiscoveryIntentPriorityMap;

  /**
   * A pinned group may remain available even when it has
   * no resolved widgets. Settings is the main example.
   */
  pinned?: boolean;

  indicator?: HubGroupIndicator;

  eligibility?: DiscoveryEligibilityRules;
};


export type DiscoveryCompactProjectionDefinition = {
  /**
   * Compact item kinds this widget can represent.
   *
   * The current compact selector supplies the item copy and live
   * values; this metadata connects that item to its owning widget.
   */
  icons: CompactDiscoveryItemIcon[];

  /**
   * Optional final adjustment after page and intent priority.
   */
  priorityBoost?: number;
};

export type DiscoveryWidgetDefinition = Omit<
  HubWidget,
  | 'id'
  | 'groupId'
  | 'componentKey'
  | 'order'
  | 'enabled'
> & {
  id: DiscoveryWidgetId;

  groupId: DiscoveryGroupId;

  componentKey?: DiscoveryComponentKey;

  compact?: DiscoveryCompactProjectionDefinition;

  defaultPriority: number;

  pagePriority?: DiscoveryPagePriorityMap;

  intentPriority?: DiscoveryIntentPriorityMap;

  eligibility?: DiscoveryEligibilityRules;
};
export type DiscoveryRegistry = {
  groups: DiscoveryGroupDefinition[];

  widgets: DiscoveryWidgetDefinition[];
};

// ============================================================
// WORKSPACE CONFIGURATION
// ============================================================

export type DiscoveryWorkspaceConfiguration = {
  enabledGroupIds?: DiscoveryGroupId[];

  disabledGroupIds?: DiscoveryGroupId[];

  enabledWidgetIds?: DiscoveryWidgetId[];

  disabledWidgetIds?: DiscoveryWidgetId[];

  groupPriorityOverrides?: Partial<
    Record<
      DiscoveryGroupId,
      number
    >
  >;

  widgetPriorityOverrides?: Partial<
    Record<
      DiscoveryWidgetId,
      number
    >
  >;
};

// ============================================================
// RESOLUTION CONTRACTS
// ============================================================

export type DiscoveryResolutionInput = {
  pageMode: DiscoveryPageMode;

  intent: FeedIntent;

  context: FeedContext;

  registry: DiscoveryRegistry;

  workspaceConfiguration?: DiscoveryWorkspaceConfiguration;

  previousActiveGroupId?: DiscoveryGroupId;
};

export type ResolvedDiscoveryWidget =
  HubWidget & {
    priority: number;

    reason: string;

    definition: DiscoveryWidgetDefinition;
  };

export type ResolvedDiscoveryGroup =
  HubGroup & {
    priority: number;

    widgetIds: DiscoveryWidgetId[];

    badge?: string | number;

    reason: string;

    definition: DiscoveryGroupDefinition;
  };

export type ResolvedCompactDiscoveryItem =
  CompactDiscoveryItem & {
    reason?: string;
  };

export type ResolvedDiscoveryExperience = {
  groups: ResolvedDiscoveryGroup[];

  widgets: ResolvedDiscoveryWidget[];

  compactItems: ResolvedCompactDiscoveryItem[];

  primaryGroupId?: DiscoveryGroupId;

  primaryWidgetId?: DiscoveryWidgetId;

  activeGroupId?: DiscoveryGroupId;

  pageMode: DiscoveryPageMode;

  intentType: DiscoveryIntentType;
};
