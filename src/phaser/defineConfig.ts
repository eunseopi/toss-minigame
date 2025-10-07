import { defineConfig } from "@apps-in-toss/web-framework/config";

interface NavigationBarOptions {
  withBackButton?: boolean;
  withHomeButton?: boolean;
  initialAccessoryButton?: InitialAccessoryButton; // 1개만 노출 가능
}

interface InitialAccessoryButton {
  id: string;
  title?: string;
  icon: {
    name: string;
  };
}

export default defineConfig<NavigationBarOptions>({
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    initialAccessoryButton: {
      id: "heart",
      title: "Heart",
      icon: {
        name: "icon-heart-mono",
      },
    },
  },
});
