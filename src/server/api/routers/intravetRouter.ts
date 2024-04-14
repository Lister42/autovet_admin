import { z } from "zod";
import { prisma } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { clientConverter, firestore, getUserAccountNos } from "@/utils/firebase";
import { appRouter } from "@/server/api/root";
import {
  addDoc,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

export const intravetRouter = createTRPCRouter({
  pushToFirebase: publicProcedure
    .input(z.object({ commit: z.boolean() }))
    .mutation(async ({ input }) => {
      // Push Intravet data to firebase pls
      //if (input.secret === 'secret?') {
      await pushIntravetToFirebase(input.commit);
      //} else { console.log("Access denied.") }
    }),
  intravet_ids: publicProcedure
    .input(z.number().array())
    .query(async ({ input }) => {
      try {
        const ids = await prisma.client.findMany({
          where: {
            AccountNo: {
              in: input,
            },
          },
          select: {
            ID: true,
          },
        });
        return {
          success: true,
          intravet_ids: ids.map((id) => id.ID),
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: error,
        };
      }
    }),

  appointments: publicProcedure.input(z.string().array()).query(({ input }) => {
    try {
      const appointments = prisma.appointment.findMany({
        where: {
          AccountId: {
            in: input,
          },
        },
        select: {
          AppointmentId: true,
          VisitId: true,
          PatientId: true,
          StartTime: true,
          EndTime: true,
          AppointmentTypeId: true,
          AccountId: true,
          AppointmentSubject: true,
          AppointmentDescription: true,
          AppointmentNotes: true,
          ReminderInfo: true,
          Reason: true,
          CheckIn: true,
          CheckOut: true,
        },
      });
      return {
        success: true,
        appointments: appointments,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: error,
      };
    }
  }),

  clients: publicProcedure
    .input(z.string().array())
    .query(async ({ input }) => {
      try {
        const clients = await prisma.client.findMany({
          where: {
            ID: {
              in: input,
            },
          },
          select: {
            ID: true,
            AccountNo: true,
            FirstName: true,
            LastName: true,
            CompanyName: true,
            Street: true,
            Street2: true,
            City: true,
            State: true,
            Zip: true,
            County: true,
            Email: true,
            //ClientPhoneNumber: true,
          },
        });
        return {
          success: true,
          clients: clients,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: error,
        };
      }
    }),

  client_email: publicProcedure.input(z.string()).query(async ({ input }) => {
    try {
      const client = await prisma.client.findFirst({
        where: {
          Email: input,
        },
        select: {
          ID: true,
            AccountNo: true,
            FirstName: true,
            LastName: true,
            CompanyName: true,
            Street: true,
            Street2: true,
            City: true,
            State: true,
            Zip: true,
            County: true,
            Email: true,
            ClientPhoneNumber: true,
        }
      });
      
      return {
        success: true,
        client: client,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: error,
      };
    }
  }),

  clients_name: publicProcedure.input(z.string()).query(async ({ input }) => {
    if (input.length < 3) {
      return {
        success: false,
        error: "Input too short",
      };
    }
    try {
      const clients = await prisma.client.findMany({
        where: {
          OR: [
            {
              FirstName: {
                contains: input,
              },
            },
            {
              LastName: {
                contains: input,
              },
            },
            {
              AND: [
                {
                  FirstName: {
                    contains: input.split(" ")[0],
                  },
                },
                {
                  LastName: {
                    contains: input.split(" ")[1],
                  },
                },
              ],
            },
          ],
        },
        select: {
          ID: true,
          FirstName: true,
          LastName: true,
          Email: true,
        },
      });
      return {
        success: true,
        clients: clients,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: error,
      };
    }
  }),

  pets: publicProcedure.input(z.string().array()).query(async ({ input }) => {
    try {
      const pets = await prisma.patient.findMany({
        where: {
          ClientID: {
            in: input,
          },
        },
        select: {
          ID: true,
          ClientID: true,
          Name: true,
          LongName: true,
          SpeciesID: true,
          BreedID: true,
          SexID: true,
          DOB: true,
          ColorID: true,
          Microchip: true,
        },
      });
      return {
        success: true,
        pets: pets,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: error,
      };
    }
  }),

  // Gives details for each invoice items
  invoice: publicProcedure.input(z.string().optional()).query(async ({input}) => {
    if (!input) {
      return {
        success: false,
        error: "No input",
      };
    }
    try {
      const invoice = await prisma.invoiceTransaction.findFirst({
        where: {
          VisitID: input,
        },
        select: {
          ID: true, // Need this to get invoiceDetails
          Description: true, 
          InvoiceNumber: true,
          Debit: true,
          Credit: true,
          PrimaryTaxAmount: true,
          SecondaryTaxAmount: true,
          TotalNetTaxableSales: true,
          DiscountAmount: true,
        }});
      const invoiceDetails = invoice ? await prisma.invoiceTransactionsDetail.findMany({
        where: {
          InvoiceTransactionID: invoice.ID
        },
        select: {
          ID: true,
          InvoiceTransactionID: true,
          ActualCharge: true,
          Quantity: true,
          Amount: true,
          UnmodifiedAmount: true, // This minus DiscountAmount is what they pay?
          PrimaryTaxAmount: true,
          SecondaryTaxAmount: true,
          DispensingFee: true,
          DiscountAmount: true,
          Description: true,
        }
      }) : null;
      return {
        success: true,
        invoice: invoice,
        invoiceDetails: invoiceDetails,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: error,
      };
    }
  }),

  breeds: publicProcedure
    .input(z.object({ brid: z.string() }))
    .query(async ({ input }) => {
      try {
        const breeds = await prisma.listBreed.findMany({
          where: {
            ID: input.brid,
          },
          select: {
            ID: true,
            Code: true,
            Description: true,
          },
        });
        return {
          success: true,
          breeds: breeds,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: error,
        };
      }
    }),

  sexes: publicProcedure
    .input(z.object({ sxid: z.string() }))
    .query(async ({ input }) => {
      try {
        const sexes = await prisma.listSex.findMany({
          where: {
            ID: input.sxid,
          },
          select: {
            ID: true,
            Description: true,
            Male: true,
            Altered: true,
            Code: true,
          },
        });
        return {
          success: true,
          sexes: sexes,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: error,
        };
      }
    }),

  species: publicProcedure
    .input(z.object({ spid: z.string() }))
    .query(async ({ input }) => {
      try {
        const species = await prisma.listSpecies.findMany({
          where: {
            ID: input.spid,
          },
          select: {
            ID: true,
            Description: true,
            SpeciesType: true,
            Code: true,
          },
        });
        return {
          success: true,
          species: species,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: error,
        };
      }
    }),

  colors: publicProcedure
    .input(z.object({ clrid: z.string() }))
    .query(async ({ input }) => {
      try {
        const colors = await prisma.listBreed.findMany({
          where: {
            ID: input.clrid,
          },
          select: {
            ID: true,
            Code: true,
            Description: true,
          },
        });
        return {
          success: true,
          colors: colors,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: error,
        };
      }
    }),

  // TODO: Add this to dump
  petWeight: publicProcedure.input(z.string()).query( ({input}) => {
    try {
      const petWeight = prisma.patientWeight.findFirst({
        where: {
          PatientID: input
      },
        select: {
          ID: true,
          PatientID: true,
          Weight: true,
          Date: true,
        },
        orderBy: {
          Date: 'desc',
        },
        take: 1,
      });
      return {
        success: true,
        petWeight: petWeight,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: error,
      };
    }
  }),

  // pendingCharges: publicProcedure.input(z.string().array()).query(({input}) => {
  //   try {
  //     const pendingCharges = prisma.pendingCharges.findMany({
  //       // where: {
  //         // Get the ones we'd need
  //       // },
  //       select: {
  //         ID: true,
  //         Description: true,
  //         Charge: true,
  //         Amount: true,
  //         Cost: true,
  //         PrimaryTaxAmount: true,
  //         SecondaryTaxAmount: true,
  //         DiscountAmount: true,
  //       },
  //     });
  //     return {
  //       success: true,
  //       pendingCharges: pendingCharges,
  //     };
  //   } catch (error) {
  //     console.log(error);
  //     return {
  //       success: false,
  //       error: error,
  //     };
  //   }
  // }),
});

async function pushIntravetToFirebase(commit: boolean) {
  // 1. Convert data to firebase types
  const caller = appRouter.intravet.createCaller({});

  //const uids: string[] = await getUserIds();

  // Get the account numbers from Firebase
  const anos: number[] = await getUserAccountNos();
  console.log(anos);

  // Retrieve real ids from intravet sql server
  const uid_resp = await caller.intravet_ids(anos);
  // Check for failures to do so
  if (
    !uid_resp.success ||
    uid_resp.intravet_ids == undefined ||
    uid_resp.intravet_ids.length == 0
  ) {
    console.log("Error getting client IDs");
    return;
  }

  // Should have real ids now
  const uids: string[] = uid_resp.intravet_ids ?? [];

  console.log("All Real IDs:\n", uids);

  const c_resp = await caller.clients(uids);
  const a_resp = await caller.appointments(uids);
  const p_resp = await caller.pets(uids);

  const clientCollection = collection(firestore, "client").withConverter(clientConverter);
  const appCollection = collection(firestore, "appointment");
  const petCollection = collection(firestore, "pets");

  // FETCH CLIENTS =============================================================================================
  if (c_resp.success && c_resp.clients != undefined) {
    for (const client of c_resp.clients) {
      const myQuery = query(
        clientCollection,
        where("account_no", "==", client.AccountNo)
      );
      const updateData = {
        intravet_id: client.ID,
        first_name: client.FirstName ?? "N/A",
        last_name: client.LastName ?? "N/A",
        email: client.Email ?? "N/A",
        primary_address: `${client.Street ?? "Street"}, ${
          client.City ?? "City"
        }, ${client.State ?? "State"}, ${client.Zip ?? "Zip"}`,
        secondary_address:
          client.Street2 != undefined
            ? `${client.Street2 ?? "Street"}, ${client.City ?? "City"}, ${
                client.State ?? "State"
              }, ${client.Zip ?? "Zip"}`
            : "N/A",
      };

      console.log("UPLOADING UPDATED CLIENT");
      if (commit) {
        try {
          const docSnap = await getDocs(myQuery);
          const docToUpdate = docSnap.docs[0];

          if (docToUpdate != undefined) {
            updateDoc(docToUpdate.ref, updateData).catch(() => {
              console.log("Updated", client.ID);
            });
          } else {
            console.log("This shouldn't have happened: ", client.ID);
          }
        } catch {
          console.log("Error retrieving document");
        }
      } else {
        console.log("\n", updateData);
      }
    }
  } else {
    console.log(
      "Error fetching client data from Intravet: ",
      c_resp.error ?? ""
    );
  }

  // FETCH APPS ================================================================================================
  if (a_resp.success && a_resp.appointments != undefined) {
    // Update Apps
    for (const app of await a_resp.appointments) {
      // Skip mock apps:
      if (app.AppointmentId.includes("mock")) continue;

      const myQuery = query(
        appCollection,
        where("appointment_id", "==", app.AppointmentId)
      );
      const docSnap = await getDocs(myQuery);
      const docToUpdate = docSnap.docs[0];

      // TODO: this might be achieved by looking at the collection itself if ref is included
      const clientQuery = query(
        clientCollection,
        where("intravet_id", "==", app.AccountId)
      );
      const clientSnap = await getDocs(clientQuery);
      const clientToAdd = clientSnap.docs[0];
    

      const petQuery = query(
        petCollection,
        where("pet_id", "==", app.PatientId)
      );
      const petSnap = await getDocs(petQuery);
      const petToAdd = petSnap.docs[0];

      let status = "closed";
      // Set app status to upcoming if future, closed to if past TODO: edge case?
      if (app.StartTime != undefined) {
        status = app.StartTime > new Date() ? "upcoming" : "closed";
      }

      if (myQuery != undefined && docToUpdate != undefined) {
        // Appointment is in Firebase n' needs updating

        // Data to update
        const updateData = {
          client_id: clientToAdd?.data().uid ?? "N/A",
          status: status,
          reason: app.Reason,
          client: clientToAdd?.ref ?? null,
          intravet_client_id: app.AccountId,
          pet: petToAdd?.ref ?? null,
          date: app.StartTime ?? new Date(),
          admin_notes: app.AppointmentNotes ?? "",
          visit_id: app.VisitId
        };

        console.log("UPLOADING UPDATED APP");
        if (commit) {
          // Update to Firebase
          try {
            if (docToUpdate != undefined) {
              updateDoc(docToUpdate.ref, updateData).catch(() => {
                console.log("Updated", app.AccountId);
              });
            } else {
              console.log("This shouldn't have happened: ", app.AccountId);
            }
          } catch (e) {
            console.log(
              "Error retrieving appointment document from firebase: ",
              e
            );
          }
        } else {
          console.log("\n", updateData);
        }
      } else {
        // Appointment isn't in Firebase rn

        try {
          const newData = {
            // Formatted new data
            client_id: clientToAdd?.data().uid ?? "N/A",
            intravet_client_id: app.AccountId,
            status: status,
            reason: app.Reason,
            appointment_id: app.AppointmentId,
            visit_id: app.VisitId,
            spot_number: -1,
            client: clientToAdd?.ref ?? null,
            pet: petToAdd?.ref ?? null,
            date: app.StartTime ?? new Date(),
            admin_notes: app.AppointmentNotes ?? "",
            notes: "",
          };

          console.log("UPLOADING NEW APP");
          if (commit) {
            // Add to Firebase
            addDoc(appCollection, newData).catch(() => {
              console.log("Added new appointment: ", app.AppointmentId);
            });
          } else {
            console.log("\n", newData);
          }
        } catch (e) {
          console.log("Error adding app document to firebase: ", e);
        }
      }
    }
  } else {
    console.log(
      "Error fetching appointment data from Intravet: ",
      a_resp.error ?? ""
    );
  }

  // FETCH PETS ================================================================================================
  if (p_resp.success && p_resp.pets != undefined) {
    // Update Pets
    for (const pet of p_resp.pets) {
      const pid = pet.ID;

      // Skip mock pets:
      if (pid.includes("mock")) continue;

      const myQuery = query(petCollection, where("pet_id", "==", pid));
      const docSnap = await getDocs(myQuery);
      const docToUpdate = docSnap.docs[0];

      const brid = pet.BreedID ?? "";
      const spid = pet.SpeciesID ?? "";
      const sxid = pet.SexID ?? "";
      const clrid = pet.ColorID ?? "";

      let breed = "N/A";
      let specie = "N/A";
      let sex = "N/A";
      let color = "N/A";

      if (brid !== "") {
        const br_resp = await caller.breeds({ brid }); // breeds
        breed =
          br_resp.breeds != undefined && br_resp.breeds[0] != undefined
            ? br_resp.breeds[0].Description ?? "N/A"
            : "N/A";
      }
      if (spid !== "") {
        const sp_resp = await caller.species({ spid }); // species
        specie =
          sp_resp.species != undefined && sp_resp.species[0] != undefined
            ? sp_resp.species[0].Description ?? "N/A"
            : "N/A";
      }
      if (sxid !== "") {
        const sx_resp = await caller.sexes({ sxid }); // sex
        sex =
          sx_resp.sexes != undefined && sx_resp.sexes[0] != undefined
            ? sx_resp.sexes[0].Description ?? "N/A"
            : "N/A";
      }
      if (clrid !== "") {
        const clr_resp = await caller.colors({ clrid }); // appearance
        color =
          clr_resp.colors != undefined && clr_resp.colors[0] != undefined
            ? clr_resp.colors[0].Description ?? "N/A"
            : "N/A";
      }

      const clientQuery = query(
        clientCollection,
        where("intravet_id", "==", pet.ClientID)
      );
      const clientSnap = await getDocs(clientQuery);
      const clientToAdd = clientSnap.docs[0];

      if (myQuery != undefined && docToUpdate != undefined) {
        // Pet is in Firebase n' needs updating

        // Data to update
        const updateData = {
          name: pet.Name ?? "N/A",
          DOB: pet.DOB ?? new Date(),
          breed: breed,
          color: color,
          // appearance: appearance, // cant find it
          sex: sex,
          microchipped: pet.Microchip != undefined ? true : false,
          species: specie,
          // tattooed: boolean,
          client_id: clientToAdd?.data().uid ?? "N/A", 
          intravet_client_id: pet.ClientID
        };

        console.log("UPLOADING UPDATED PET");
        if (commit) {
          // Update to Firebase
          try {
            if (docToUpdate != undefined) {
              updateDoc(docToUpdate.ref, updateData).catch(() => {
                console.log("Updated", pet.ID);
              });
            } else {
              console.log("This shouldn't have happened: ", pet.ID);
            }
          } catch (e) {
            console.log("Error retrieving pet document from firebase: ", e);
          }
        } else {
          console.log("\n", updateData);
        }
      } else {
        // Pet isn't in Firebase rn

        try {
          const newData = {
            // Format new data
            pet_id: pet.ID,
            name: pet.Name ?? "N/A",
            DOB: pet.DOB ?? new Date(),
            breed: breed,
            appearance: "N/A",
            color: color,
            sex: sex,
            microchipped: pet.Microchip != undefined ? true : false,
            species: specie,
            tattooed: false,
            client_id: clientToAdd?.data().uid ?? "N/A", 
            intravet_client_id: pet.ClientID
          };

          console.log("UPLOADING NEW PET");
          if (commit) {
            // Add to Firebase
            addDoc(petCollection, newData).catch(() => {
              console.log("Added new pet: ", pet.ID);
            });
          } else {
            console.log("\n", newData);
          }
        } catch (e) {
          console.log("Error adding pet document to firebase: ", e);
        }
      }
    }
  } else {
    console.log("Error fetching pet data from Intravet: ", p_resp.error ?? "");
  }

  // TODO: CLEAN UP FIREBASE (Rid of any no longer used docs)

  console.log("\n\nTask Complete.\n\n");
}
