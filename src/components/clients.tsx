import { collection } from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { clientConverter, firestore } from "@/utils/firebase";
import ClientDetails from "@/components/clientDetails";
import { useEffect, useState } from "react";
import type { ClientType } from "@/utils/types";
import { formatPhoneNumber } from "@/utils/format";

export default function Appointments() {
  const [clients, loading, error] = useCollectionData(
    collection(firestore, "client").withConverter(clientConverter),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  const [selectedClient, setSelectedClient] = useState<ClientType>();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState<ClientType[]>([]);

  useEffect(() => {
    if (clients) {
      const filtered = clients.filter((client) =>
        (`${client.first_name ?? ""} ${client.last_name ?? ""} ${client.phone_number ?? ""}`)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [clients, searchTerm]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <>
      <div>
      <div className="flex flex-row h-screen">

        {/* Appointment Selection/List */}
        <div className="w-1/4 flex-none flex-col pt-3 px-3 border-r border-gray-800 shadow-xl">

          {/* Search Clients */}
          <div className="relative pb-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg aria-hidden="true" className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="search" onChange={handleSearch} id="default-search" className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search clients" />
          </div>


          <ul className="">

          {/* List Clients */}
              {loading && <progress className="progress progress-primary w-full"></progress>}
              {!loading && error && <strong>Error: {JSON.stringify(error)}</strong>}
              {filteredClients != undefined &&
                filteredClients.map((client) => (
                  <li
                    className="shadow-md my-1"
                    key={client.uid}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className={(client.uid === (selectedClient?.uid ?? "N/A")) ? "scale-[0.97] brightness-75" : ""}>
                      <Client {...client} />
                    </div>
                  </li>
                ))}

          </ul>
        </div>

        {/* Client Details/Content */}
        <div className="pt-3 pl-6 pr-3 flex flex-col flex-grow">

              {selectedClient ? (
                <ClientDetails {...selectedClient} />
              ) : (
                <div className="">
                  <h1 className="text-2xl pb-1">
                    <b>Client Details</b>
                  </h1>
                  <hr></hr>
                  <p>Select a client</p>
                </div>
              )}
          
        </div>
      </div>
    </div>
    </>
  );
}

export function Client(client: ClientType) {
  return (
    <button className="btn-primary btn-block mb-1 py-3 text-sm" key={client.uid}>
      <b>
        {client.first_name} {client.last_name} | {formatPhoneNumber(client.phone_number)}
      </b>
    </button>
  );
}
