import { Decimal } from "@prisma/client/runtime";

export const formatPhoneNumber = (number: string) => {
    //Filter only numbers from the input
    const cleaned = ('' + number).replace(/\D/g, '');
    
    //Check if the input is of correct length
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
    if (match && match[1] && match[2] && match[3]) {
      return `(${match[1]}) ${match[2]} ${match[3]}`;
    }
  
    return null
  };

export const formatTime = (date: Date) => {
  const t = date.toLocaleTimeString().split(":");
  const AmOrPm = t[2]?.split(" ")[1];
  return (t[0] && t[1] && AmOrPm) ? `${t[0]}:${t[1]} ${AmOrPm}` : "Error";
}

export const formatCost = (cost: Decimal) => {
  return `$${+cost > 999 ? (Math.round(+cost * 100) / 100).toFixed(2) : (Math.round(+cost * 100) / 100).toFixed(2)}`
}