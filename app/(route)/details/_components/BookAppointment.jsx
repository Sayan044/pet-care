'use client'
import React, { useState, useTransition, useRef } from 'react';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import GlobalApi from "@/app/_utils/GlobalApi";
import { toast } from "sonner";

export default function BookAppointment({ doctor_id, appointments }) {
    const { user } = useKindeBrowserClient();
    const [isPending, startTransition] = useTransition()

    const [date, setDate] = useState(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = useState();
    const [note, setNote] = useState("");

    const dialogCloseRef = useRef(null);

    const timeSlots = makeTimeSlots()

    const isPastDay = (day) => {
        // `day` argument returns date at 12:00 am affter that every time in new Date() is greater than `day`
        return day.getTime() + 24 * 3600 * 1000 <= new Date().getTime();
    };


    const saveBooking = () => {
        // Check if user object exists and if the necessary fields are present
        if (!user || !user.given_name || !user.family_name || !user.email) {
            console.error("User information is not available");
            toast.error("User information is not available. Please log in.");
            return;
        }

        // Format date as MM-DD-YYYY
        const formattedDate = date.toLocaleDateString("en-CA")

        const data = {
            data: {
                Username: `${user.given_name || "Guest"} ${user.family_name || "User"}`,  // Correct the case to match Strapi's field
                email: user.email,
                Time: selectedTimeSlot,
                Date: formattedDate,
                doctor: doctor_id,
                Note: note || ""  // Handle an empty note field
            }
        };

        startTransition(() => {
            GlobalApi.bookAppointment(data).then(async (res) => {
                if (res.status === 200) {
                    toast("Booking Confirmation will be sent to your email", {
                        style: { backgroundColor: '#28a745', color: 'white' },
                    })

                    const mailData = res.data.data.attributes
                    fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/mail`, {
                        method: 'POST',
                        body: JSON.stringify({
                            name: mailData.Username,
                            email: mailData.email,
                            doctorName: mailData.doctor.data.attributes.Name,
                            date: mailData.Date,
                            time: mailData.Time,
                            isAppointment: true
                        })
                    })
                }

            })
                .catch((error) => {
                    console.error("Error booking appointment:", error.response?.data || error.message);
                })
                .finally(() => {
                    resetAppointment()
                })
        })
    };

    const resetAppointment = () => {
        setDate(new Date())
        setSelectedTimeSlot()
        dialogCloseRef.current.click()
    }

    return (
        <Dialog>
            <DialogTrigger>
                <Button className="mt-3 rounded-full">Book Appointment</Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-black">
                <DialogHeader>
                    <DialogTitle>Book Appointment</DialogTitle>
                    <DialogDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 mt-5">

                            {/* Calendar */}
                            <div className="flex flex-col gap-3 items-baseline">
                                <h2 className="flex gap-2 items-center">
                                    <CalendarDays className="text-primary h-5 w-5" />
                                    Select Date
                                </h2>
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={isPastDay}
                                    className="rounded-md border"
                                />
                            </div>

                            {/* Time Slot */}
                            <div className="mt-3 md:mt-0">
                                <h2 className="flex gap-2 items-center mb-3">
                                    <Clock className="text-primary h-5 w-5" />
                                    Select Time Slot
                                </h2>
                                <div className="grid grid-cols-3 gap-2 border rounded-lg p-5">
                                    {timeSlots.map((time, index) => {
                                        const isAvailable = getFreeTimeSlots(date, appointments).includes(time)

                                        return (
                                            <h2
                                                key={index}
                                                onClick={() => isAvailable && setSelectedTimeSlot(time)}
                                                className={`p-2 border cursor-pointer text-center rounded-full
                                                    ${isAvailable ? "hover:bg-primary hover:text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}
                                                    ${time === selectedTimeSlot ? "bg-primary text-white" : ""}`}
                                                style={{ pointerEvents: isAvailable ? 'auto' : 'none' }}
                                            >
                                                {time}
                                            </h2>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Note Section */}
                            <div className="mt-3 md:mt-0">
                                <textarea
                                    placeholder="Add a note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="p-2 border rounded-lg w-full"
                                />
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="sm:justify-end">
                    <DialogClose>
                        <Button ref={dialogCloseRef} type="button" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        disabled={!!(!(date && selectedTimeSlot) || isPending)}
                        onClick={() => saveBooking()}
                    >
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function makeTimeSlots() {
    const timeList = [];
    for (let i = 10; i <= 12; i++) {
        timeList.push(i + ":00 AM");
        timeList.push(i + ":30 AM");
    }
    for (let i = 1; i <= 6; i++) {
        timeList.push(i + ":00 PM");
        timeList.push(i + ":30 PM");
    }

    return timeList
};

function getFreeTimeSlots(date, appointments) {
    const time_slots = makeTimeSlots();
    const fullDate = date.toLocaleDateString("en-US", {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });

    let appoinments_time = []
    if (appointments.length > 0) {
        appoinments_time = appointments.map((item) => {
            return new Date(item.attributes.Date + " " + item.attributes.Time).getTime();
        });
    }


    const timeslots_time = time_slots.map((time) => {
        return new Date(fullDate + " " + time).getTime();
    });

    const available_slots = time_slots.filter(
        (_, index) => !appoinments_time.includes(timeslots_time[index])
    );

    return available_slots
};
