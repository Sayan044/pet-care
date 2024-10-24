import { ClockIcon, MapPin } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const BookService = dynamic(() => import('./BookService'), {
  ssr: false
})

function ServiceDetail({ service }) {

  // Helper function to render the "About" field
  const renderAboutContent = (aboutContent) => {
    if (Array.isArray(aboutContent)) {
      return aboutContent.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={index} className='text-gray-500 tracking-wide mt-2'>
              {block.children?.map((child, idx) => child.text).join(' ')}
            </p>
          );
        }
        return null; // You can handle other types of blocks if necessary
      });
    }
    return <p className='text-gray-500 tracking-wide mt-2'>{aboutContent}</p>;
  };

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-3 border-[1px] p-5 mt-5 rounded-lg'>
        {/* Provider Image */}
        <div>
          <Image
            src={service.attributes?.image?.data?.[0]?.attributes?.url}
            width={200}
            height={200}
            alt='provider-image'
            className='rounded-lg w-full h-[280px] object-cover'
          />
        </div>
        {/* Service Info */}
        <div className='col-span-2 mt-5 flex md:px-10 flex-col gap-3 items-baseline'>
          <h2 className='font-bold text-2xl'>{service.attributes?.Provider_name}</h2>
          <h2 className='flex gap-2 text-gray-500 text-md'>
            <ClockIcon />
            <span>{service.attributes?.Open_time} time open</span>
          </h2>
          <h2 className='text-md flex gap-2 text-gray-500'>
            <MapPin />
            <span>{service.attributes?.Address}</span>
          </h2>
          <h2 className='text-[10px] bg-blue-100 p-1 rounded-full px-2 text-primary'>
            {service.attributes?.category?.data?.attributes?.Name}
          </h2>
          <h2 className='text-lg font-bold text-gray-700'>
            Price: ₹{service.attributes?.price}
          </h2>

          <BookService service_id={service.id} bookings={service.attributes.bookings.data} />
        </div>
      </div>

      {/* About Provider */}
      <div className='p-3 border-[1px] rounded-lg mt-5'>
        <h2 className='font-bold text-[20px]'>About Me</h2>
        {renderAboutContent(service.attributes?.About)}
      </div>

      {/* Payment Section */}
      <div className='p-3 border-[1px] rounded-lg mt-5'>
        <h2 className='font-bold text-[20px]'>Payment</h2>
        <p className='text-lg text-gray-700'>
          Total Amount: ₹{service.attributes?.price}
        </p>
        <Button className="mt-3 w-full bg-gray-500" disabled>
          Proceed to Pay ₹{service.attributes?.price}
        </Button>
      </div>
    </>
  );
}

export default ServiceDetail;
