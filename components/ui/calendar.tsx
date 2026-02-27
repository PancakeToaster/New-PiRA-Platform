import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    const [month, setMonth] = React.useState<Date>(props.selected as Date || new Date())
    const [showMonthPicker, setShowMonthPicker] = React.useState(false)
    const [viewMode, setViewMode] = React.useState<'days' | 'months' | 'years'>('days')
    const [displayYear, setDisplayYear] = React.useState(month.getFullYear())

    React.useEffect(() => {
        if (props.selected) {
            setMonth(props.selected as Date)
            setDisplayYear((props.selected as Date).getFullYear())
        }
    }, [props.selected])

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const handleMonthClick = (monthIndex: number) => {
        const newDate = new Date(displayYear, monthIndex, 1)
        setMonth(newDate)
        setViewMode('days')
    }

    const handleYearClick = (year: number) => {
        setDisplayYear(year)
        setViewMode('months')
    }

    const years = React.useMemo(() => {
        const yearList = []
        for (let year = 1960; year <= 2030; year++) {
            yearList.push(year)
        }
        return yearList
    }, [])

    // Month picker view
    if (viewMode === 'months') {
        return (
            <div className="p-3">
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDisplayYear(displayYear - 1)}
                        disabled={displayYear <= 1960}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <button
                        onClick={() => setViewMode('years')}
                        className="text-sm font-medium hover:underline"
                    >
                        {displayYear}
                    </button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDisplayYear(displayYear + 1)}
                        disabled={displayYear >= 2030}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {months.map((monthName, index) => {
                        const isSelected =
                            month.getMonth() === index &&
                            month.getFullYear() === displayYear
                        return (
                            <button
                                key={monthName}
                                onClick={() => handleMonthClick(index)}
                                className={cn(
                                    "p-2 text-sm rounded-md transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                )}
                            >
                                {monthName.slice(0, 3)}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Year picker view
    if (viewMode === 'years') {
        const currentDecadeStart = Math.floor(displayYear / 12) * 12
        const displayYears = years.slice(
            Math.max(0, years.indexOf(currentDecadeStart)),
            Math.min(years.length, years.indexOf(currentDecadeStart) + 12)
        )

        return (
            <div className="p-3">
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDisplayYear(displayYear - 12)}
                        disabled={displayYear - 12 < 1960}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        {displayYears[0]} - {displayYears[displayYears.length - 1]}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDisplayYear(displayYear + 12)}
                        disabled={displayYear + 12 > 2030}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {displayYears.map((year) => {
                        const isSelected = month.getFullYear() === year
                        return (
                            <button
                                key={year}
                                onClick={() => handleYearClick(year)}
                                className={cn(
                                    "p-2 text-sm rounded-md transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                )}
                            >
                                {year}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Day picker view (default)
    return (
        <DayPicker
            month={month}
            onMonthChange={setMonth}
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium cursor-pointer hover:underline",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground",
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside:
                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                Caption: ({ displayMonth }) => (
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setViewMode('months')
                        }}
                        type="button"
                        className="text-sm font-medium hover:underline"
                    >
                        {displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </button>
                ),
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
