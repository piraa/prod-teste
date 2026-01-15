export interface NavItem {
  name: string;
  id: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: "Foundation",
    items: [
      { name: "Design Tokens", id: "tokens" },
      { name: "Colors", id: "colors" },
      { name: "Typography", id: "typography" },
    ]
  },
  {
    title: "Components",
    items: [
      { name: "Buttons", id: "buttons" },
      { name: "Cards", id: "cards" },
      { name: "Badges", id: "badges" },
      { name: "Alerts", id: "alerts" },
      { name: "Inputs", id: "inputs" },
    ]
  }
];
