import type { PetType } from "@/utils/types";
import {storage } from "@/utils/firebase";
import { ref as storageRef } from "firebase/storage";
import { useDownloadURL } from "react-firebase-hooks/storage";
import Image from "next/image";

export default function PetDetails(pet: PetType) {

  function formatAge(DOB: Date) {
    const total_years = (((new Date).valueOf()) - pet.DOB.valueOf())/(60000*60*24*365);
    const years = Math.floor(total_years);
    const months = Math.floor((total_years - years)*12)
    return `${years} ${years > 1 ? "Y" : "Y"} ${months} ${months > 1 ? "M" : "M"}`;
  }

  const storage_ref = storageRef(
    storage,
    "images/pets/" + (pet ? pet.pet_ref.id : "paw-icon-light.png")
  );

  
  const [image_url, image_loading] = useDownloadURL(storage_ref);

  return (
    <div className="mb-6" key={pet.pet_id}>
      <div className="card w-96 bg-neutral shadow-xl">
        <figure className={!image_loading && image_url
                ? "" : "mt-3"}>
          {!image_loading ? (
          <Image
            src={
              !image_loading && image_url
                ? image_url
                : "/images/paw_icon.png"
            }
            alt="Pet Picture"
            width={!image_loading && image_url
              ? 900 : 200}
            height={!image_loading && image_url
              ? 900 : 200}
          />
          ):(
            <div className="animate-pulse rounded-md w-48 h-48">
            </div>
          )}
        </figure>
        <div className="card-body">
          <h2 className="card-title">{pet.name} - {pet.species}: {pet.breed}</h2>
          <hr></hr>

          {/* Sex */}
          <div className="flex flex-row">
            <p className="p-2 text-center bg-base-100 badge badge-lg rounded-md border">
              <b>{pet.sex.toUpperCase()}</b>
            </p>
          </div>

           {/* Date of birth & age */}
          <div className="stats stats-vertical shadow">
            <div className="stat">
              <div className="stat-figure text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12C21 10.34 19.66 9 18 9z" /></svg>
              </div>
              <div className="stat-title">Age</div>
              <div className="stat-value">{pet.DOB ? formatAge(pet.DOB) : "N/A"}</div>
              <div className="stat-desc"><b>DOB: </b>{pet.DOB ? pet.DOB.toLocaleDateString() : "N/A"}</div>
            </div>
          </div>
  
          <div className="flex flex-row">

            {/* Left section */}
            <div className="flex-none flex-row">

              <div className="flex flex-row gap-3">
                <p>
                  <b>Microchipped</b>
                  {
                    pet.microchipped ?
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="inline-block w-8 h-8 stroke-current"><path fill="white" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    :
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="inline-block w-8 h-8 stroke-current"><path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  }
                  {/* {pet.microchipped ? "yes" : "no"} */}
                </p>
                <p>
                <b>Tattooed</b>
                  {
                    pet.tattooed ?
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="inline-block w-8 h-8 stroke-current"><path fill="white" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    :
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="inline-block w-8 h-8 stroke-current"><path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  }
                </p>
              </div>
              
              <p>
                <b>Appearance:</b> {pet.appearance}
              </p>

            </div>

            {/* Right Section */}
            <div className="flex-none flex-col">

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
