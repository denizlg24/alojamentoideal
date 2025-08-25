import { callHostkitAPI } from '@/app/actions/callHostkitApi';
import { connectDB } from '@/lib/mongodb';
import GuestDataModel from '@/models/GuestData';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json("Unauthorized", { status: 401 });
    }
    await connectDB();
    const foundBookings = await GuestDataModel.find({ synced: false });
    for (const booking of foundBookings) {
        await callHostkitAPI({
            listingId: booking.listing_id,
            endpoint: "removeAllGuests", query: {
                rcode: booking.booking_code,
            }
        })
        for (const guest of booking.guest_data) {
            const response = await callHostkitAPI({
                listingId: booking.listing_id,
                endpoint: "addGuest",
                query: {
                    rcode: booking.booking_code,
                    arrival: guest.arrival,
                    departure: guest.departure,
                    first_name: guest.first_name,
                    last_name: guest.last_name,
                    nationality: guest.nationality,
                    birthday: guest.birthday,
                    doc_id: guest.document_number,
                    doc_type: guest.document_type,
                    doc_country: guest.document_country,
                    country_residence: guest.country_residence,
                    city_residence: guest.city_residence
                }
            })
            console.log(response);
        }
        await GuestDataModel.findOneAndUpdate({ booking_code: booking.booking_code }, { synced: true })
    }
    return NextResponse.json({ ok: true });
}