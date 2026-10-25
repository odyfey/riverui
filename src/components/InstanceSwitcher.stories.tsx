import type { Meta, StoryObj } from "@storybook/react-vite";

import { InstanceSwitcherView } from "./InstanceSwitcher";
import { type Instance } from "./InstanceSwitcher.model";

const instances: Instance[] = [
  {
    base: "/prod",
    color: "#dc2626",
    healthy: true,
    label: "Prod",
    name: "prod",
  },
  {
    base: "/staging",
    color: "#d97706",
    healthy: true,
    label: "Staging",
    name: "staging",
  },
  { base: "/tenant-a", healthy: false, label: "Tenant A", name: "tenant-a" },
];

const meta: Meta<typeof InstanceSwitcherView> = {
  args: {
    current: instances[0],
    hrefFor: (instance: Instance) => `${instance.base}/jobs`,
    instances,
  },
  component: InstanceSwitcherView,
  decorators: [
    (Story) => (
      <div className="flex h-96 w-48 flex-col justify-end bg-slate-100 dark:bg-slate-800">
        <Story />
      </div>
    ),
  ],
  title: "Components/InstanceSwitcher",
};

export default meta;
type Story = StoryObj<typeof InstanceSwitcherView>;

export const Default: Story = {};

export const UncoloredInstance: Story = {
  args: { current: instances[2] },
};
