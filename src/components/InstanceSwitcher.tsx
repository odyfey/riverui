import { Dropdown, DropdownMenu } from "@components/Dropdown";
import { MenuButton, MenuItem } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";

import {
  currentBase,
  getInstances,
  type Instance,
  instancesKey,
  switchHref,
} from "./InstanceSwitcher.model";

const DEFAULT_COLOR = "#64748b";

const InstanceMark = ({ instance }: { instance: Instance }) => (
  <span
    aria-hidden="true"
    className="flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white uppercase"
    style={{ backgroundColor: instance.color || DEFAULT_COLOR }}
  >
    {instance.label.slice(0, 1)}
  </span>
);

type InstanceSwitcherViewProps = {
  current: Instance;
  hrefFor: (instance: Instance) => string;
  instances: Instance[];
};

export const InstanceSwitcherView = ({
  current,
  hrefFor,
  instances,
}: InstanceSwitcherViewProps) => (
  <Dropdown>
    <MenuButton
      className="group flex w-full gap-x-5 border-l-4 p-5 pl-4 text-left text-sm leading-6 font-semibold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      style={{ borderLeftColor: current.color || DEFAULT_COLOR }}
      title={`Instance: ${current.label}`}
    >
      <InstanceMark instance={current} />
      <span className="truncate">{current.label}</span>
      <ChevronUpDownIcon
        aria-hidden="true"
        className="ml-auto size-5 shrink-0 self-center"
      />
    </MenuButton>
    <DropdownMenu anchor="top start" className="z-50 min-w-48">
      {instances.map((instance) => (
        <MenuItem
          as="a"
          className="col-span-full flex items-center gap-x-3 rounded-lg px-3 py-1.5 text-sm/6 text-zinc-950 focus:outline-hidden data-focus:bg-blue-500 data-focus:text-white dark:text-white"
          href={hrefFor(instance)}
          key={instance.name}
        >
          <InstanceMark instance={instance} />
          <span className="flex-1">
            {instance.label}
            {!instance.healthy && (
              <span className="ml-2 text-xs opacity-70">unreachable</span>
            )}
          </span>
          <CheckIcon
            aria-hidden="true"
            className={clsx(
              "size-4 shrink-0",
              instance.name !== current.name && "invisible",
            )}
          />
        </MenuItem>
      ))}
    </DropdownMenu>
  </Dropdown>
);

export const InstanceSwitcher = () => {
  const { data: instances } = useQuery({
    queryFn: getInstances,
    queryKey: instancesKey(),
    retry: false,
    staleTime: 30_000,
  });

  const base = currentBase();
  const current = instances?.find((instance) => instance.base === base);
  if (!instances || !current) {
    return null;
  }

  return (
    <InstanceSwitcherView
      current={current}
      hrefFor={(instance) => switchHref(base, instance, window.location)}
      instances={instances}
    />
  );
};

export default InstanceSwitcher;
