import { useState } from "react";
import type { AppointmentType, ClientType } from "../utils/types";
import { Status } from "../utils/types";
import { api } from "@/utils/api";
import { formatCost } from "@/utils/format";
import { setDoc, updateDoc } from "firebase/firestore";
import { showNotification } from "@/utils/toastr";

interface InvoiceInfoProps {
  appointment: AppointmentType;
  client: ClientType;
  sendMessage: () => void;
}

export default function InvoiceInfo({ appointment, client, sendMessage }: InvoiceInfoProps) {

  console.log('showing invoice info for ', appointment ? appointment.visit_id: "ONONONNO" );

  const resp = api.intravet.invoice.useQuery(appointment.visit_id);

  const [cost, setCost] = useState<number>(-1); // TODO: Do something with this to send over (also maybe somehow do it as a number)

  async function setStatus(newStatus: string) {
    //setChange(!change);

    const result = await setDoc(
      appointment.appointment_ref,
      { status: newStatus },
      { merge: true }
    );
    console.log(result);
  }

  async function sendInvoice() {
    const costToSend = (resp.data && resp.data.success && resp.data.invoice) 
    ? (+resp.data?.invoice?.Credit > 0 ? +resp.data?.invoice?.Credit : +resp.data?.invoice?.Debit)
    : cost;

    if (costToSend !== undefined && !Number.isNaN(costToSend)) {
      // Update cost
      try {
        await updateDoc(appointment.appointment_ref, {
          cost: costToSend
        })
      } catch (e) { 
        console.log("error updating cost"); 
      }
      // Update status
      try {
        await setStatus(Status.InvoiceSent); 
        showNotification("success", "Invoice sent");
      } catch (e) { 
        console.log("error updating status"); 
        return;
      }
    } else {
      console.log("Not valid cost");
      showNotification("error", "Invalid cost");
    }
    console.log("Sending an invoice message");
    sendMessage();
  }

  return (
    <div>
      {client ? (
        <div>
          <div>
            <h3 className="text-center">
              <b>Invoice</b>
            </h3>
            <hr className="mb-2"></hr>
          </div>

          <div>
            <p>
              <b>Slippery Rock Veterinarian Hospital</b>
              {" - "}<i>131 Branchton Rd, Slippery Rock, PA 16057</i>
            </p>
            <p>
            </p>
          </div>
          <div>
            <p>
              <b>Bill to: </b>
              {client.first_name} {client.last_name},{" "}
              {client.primary_address}
            </p>
            {/* Invoicing */}
            {resp.isLoading ? <progress className="progress progress-primary w-full"></progress> :
            <div>
            {(resp.data && resp.data.success && resp.data.invoice) ?
              // Intravet Transaction details
              <div>
                {(resp && resp.data && resp.data.invoiceDetails && resp.data.invoiceDetails.length > 0) 
                ?
                <div className="overflow-x-auto">
                  <table className="table table-compact w-full my-3">
                    <thead>
                      <tr>
                        <th>Description</th> 
                        <th>Item Price</th> 
                        <th>Quantity</th> 
                        <th>Discount</th>
                        <th>Amount</th>
                      </tr>
                    </thead> 
                    <tbody>
                      {
                      resp.data.invoiceDetails.map((detail) => (
                          <tr key={detail.ID}>
                            <th>{detail.Description}</th> 
                            <td>{formatCost(detail.ActualCharge)}</td> 
                            <td>{+detail.Quantity}</td> 
                            <td>-{formatCost(detail.DiscountAmount)}</td>
                            <td>{formatCost(detail.Amount)}</td> 
                          </tr>
                       ))
                      }
                    </tbody> 
                    <tfoot>
                      <tr>
                        <th>Total</th> 
                        <th></th> 
                        <th></th> 
                        <th></th> 
                        <th>{(resp.data && resp.data.invoice) ? 
                          <p>{+resp.data?.invoice.Debit > 0 ? formatCost(resp.data?.invoice.Debit) :
                          formatCost(resp.data?.invoice.Credit)}</p>
                          : <p>N/A</p>}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                :
                <p text-sm>No invoice details found</p>
                }
              </div>
              :
              // Custom input
              <div>
                <div className="relative">
                  <div className=" absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    $
                  </div>
                  <input 
                    id="invoice_value"
                    type="number" 
                    step="0.01" 
                    className="mb-3 mt-2 block w-full pl-6 py-3 pr-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    value={cost} 
                    placeholder="0.00"
                    onChange={(e) => (setCost(Math.round(parseFloat(e.target.value) * 100) / 100) )}
                  />
                </div>
              </div>
            }
            <button
              className="btn-primary btn btn-block"
              onClick={async () => {await sendInvoice()}}
            >
             Send Invoice
            </button>
            </div>
          }
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}
