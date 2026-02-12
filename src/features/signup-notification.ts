import Config from "@/config";

const isEnabled = () =>
  Config.FEATURE_SIGN_UP_SLACK_NOTIFICATION_ENABLED &&
  !!Config.FEATURE_SIGN_UP_SLACK_CHANNEL_ID;

export const SignUpNotificationFeature = {
  isEnabled,
  getChannelId: () => Config.FEATURE_SIGN_UP_SLACK_CHANNEL_ID!,
};
