import React, { useState, useEffect } from 'react'
import { PastMeeting } from '../hooks/useMeetings'
import { Clock, ExternalLink, Video, Search, CalendarIcon } from 'lucide-react'
import AttendeeAvatars from './AttendeeAvatars'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'

interface PastMeetingsProps {
    pastMeetings: PastMeeting[]
    pastLoading: boolean
    onMeetingClick: (id: string) => void
    getAttendeeList: (attendees: any) => string[]
    getInitials: (name: string) => string
    onSearch: (filters: any) => void
}

function PastMeetings({
    pastMeetings,
    pastLoading,
    onMeetingClick,
    getAttendeeList,
    getInitials,
    onSearch
}: PastMeetingsProps) {

    const [searchTerm, setSearchTerm] = useState('')
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [duration, setDuration] = useState<string>('')
    const [customRange, setCustomRange] = useState<string>('')


    const handleSearch = () => {
        onSearch({
            searchTerm,
            startDate: dateRange?.from,
            endDate: dateRange?.to,
            duration,
        })
    }

    const handleCustomRangeChange = (value: string) => {
        setCustomRange(value)
        const now = new Date();
        let from: Date | undefined;
        let to: Date | undefined = now;

        switch (value) {
            case 'last_week':
                from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
                break;
            case 'last_month':
                from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                break;
            case 'last_quarter':
                from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
                break;
            default:
                from = undefined;
                to = undefined;
        }
        setDateRange({ from, to })
    }

    useEffect(() => {
        if (dateRange) {
            handleSearch()
        }
    }, [dateRange, duration])

    return (
        <div>
            <div className='bg-card rounded-lg p-4 border border-border mb-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='lg:col-span-2'>
                        <Input
                            placeholder='Search meetings...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full'
                        />
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className='w-full justify-start text-left font-normal'
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    <Select onValueChange={handleCustomRangeChange} value={customRange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="last_week">Last Week</SelectItem>
                            <SelectItem value="last_month">Last Month</SelectItem>
                            <SelectItem value="last_quarter">Last Quarter</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setDuration} value={duration}>
                        <SelectTrigger>
                            <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">Less than 30 mins</SelectItem>
                            <SelectItem value="60">30 mins to 1 hour</SelectItem>
                            <SelectItem value="61">More than 1 hour</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSearch} className='w-full md:col-span-2 lg:col-span-4'>
                        <Search className='h-4 w-4 mr-2' />
                        Search
                    </Button>
                </div>
            </div>
            {pastLoading ? (
                <div className='space-y-4'>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className='bg-card rounded-lg p-4 border border-border animate-pulse'>
                            <div className='flex justify-between items-start mb-3'>
                                <div className='flex items-center gap-3 flex-1'>
                                    <div className='h-6 bg-muted rounded w-48'></div>
                                    <div className='flex -space-x-2'>

                                        {[1, 2, 3].map((j) => (
                                            <div key={j} className='w-6 h-6 rounded-full bg-muted'></div>
                                        ))}
                                    </div>

                                </div>
                                <div className='h-5 bg-muted rounded w-20'></div>
                            </div>

                            <div className='h-4 bg-muted rounded w-3/4 mb-3'></div>
                            <div className='h-4 bg-muted rounded w-1/2 mb-3'></div>
                            <div className='h-6 bg-muted rounded w-24'></div>

                        </div>
                    ))}

                </div>
            ) : pastMeetings.length === 0 ? (
                <div className='bg-card rounded-lg p-8 text-center border border-border'>
                    <Video className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                    <h3 className='text-lg font-medium mb-2 text-foreground'>No past meetings</h3>
                    <p className='text-muted-foreground'>Your completed meetings will appear here</p>
                </div>
            ) : (
                <div className='space-y-4'>
                    {pastMeetings.map((meeting) => (
                        <div
                            key={meeting.id}
                            className='bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow cursor-pointer'
                            onClick={() => onMeetingClick(meeting.id)}
                        >
                            <div className='flex justify-between items-start mb-3'>
                                <div className='flex items-center gap-3 flex-1'>
                                    <h3 className='font-semibold text-lg text-foreground'>
                                        {meeting.title}
                                    </h3>
                                    {meeting.attendees && (
                                        <AttendeeAvatars
                                            attendees={meeting.attendees}
                                            getAttendeeList={getAttendeeList}
                                            getInitials={getInitials}
                                        />
                                    )}
                                </div>
                                <span className='text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full'>
                                    Completed
                                </span>
                            </div>
                            {meeting.description && (
                                <p className='text-sm text-muted-foreground mb-3'>{meeting.description}</p>
                            )}

                            <div className='text-sm text-muted-foreground mb-3'>
                                <div className='flex items-center gap-2'>
                                    <Clock className='h-4 w-4' />
                                    <span>
                                        {format(new Date(meeting.startTime), 'PPp')} - {format(new Date(meeting.endTime), 'pp')}
                                    </span>
                                </div>
                            </div>

                            <div
                                className='flex gap-2 mt-4'
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Button
                                    className='flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors h-6 cursor-pointer'
                                    onClick={() => onMeetingClick(meeting.id)}
                                >
                                    <ExternalLink className='h-3 w-3' />
                                    View Details
                                </Button>

                            </div>

                        </div>
                    ))}

                </div>
            )}
        </div>
    )
}

export default PastMeetings
