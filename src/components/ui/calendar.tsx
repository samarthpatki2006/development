import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-blue-200",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 text-blue-300 hover:text-blue-200 transition-colors duration-200"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-blue-300/70 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative rounded-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-blue-100 rounded-md transition-all duration-200 hover:bg-blue-500/20 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"
        ),
        day_selected:
          "bg-blue-600 text-white rounded-md hover:bg-blue-500 focus:bg-blue-500 focus:text-white shadow-[0_0_2px_rgba(59,130,246,0.4)]",
        day_today:
          "bg-blue-900/40 text-blue-200 border border-blue-700 font-semibold rounded-md",
        day_outside:
          "text-blue-400/50 opacity-50 aria-selected:bg-blue-900/30 aria-selected:text-blue-200 rounded-md",
        day_disabled: "text-blue-400/30 opacity-40 rounded-md",
        day_range_middle:
          "aria-selected:bg-blue-700/40 aria-selected:text-white rounded-md",
        day_hidden: "invisible",
        ...classNames,
      }}


      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
