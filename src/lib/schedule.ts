import { addMonths, format, parseISO } from "date-fns";

export interface ScheduleLineInput {
  due_date: string;
  amount_due: number;
  label: string;
}

export interface GenerateScheduleParams {
  totalAmount: number;
  downPayment: number;
  numMonths: number;
  firstDueDate: string;
}

export function generatePaymentSchedule(
  params: GenerateScheduleParams
): ScheduleLineInput[] {
  const { totalAmount, downPayment, numMonths, firstDueDate } = params;

  if (downPayment >= totalAmount) {
    return [
      {
        label: "Acompte",
        amount_due: totalAmount,
        due_date: firstDueDate,
      },
    ];
  }

  const remaining = totalAmount - downPayment;
  const monthlyAmount = Math.floor(remaining / (numMonths + 1));
  const lines: ScheduleLineInput[] = [];

  if (downPayment > 0) {
    lines.push({
      label: "Acompte",
      amount_due: downPayment,
      due_date: firstDueDate,
    });
  }

  for (let i = 0; i < numMonths; i++) {
    const dueDate = addMonths(parseISO(firstDueDate), downPayment > 0 ? i + 1 : i);
    lines.push({
      label: `Mensualité ${i + 1}/${numMonths}`,
      amount_due: monthlyAmount,
      due_date: format(dueDate, "yyyy-MM-dd"),
    });
  }

  const scheduledTotal = lines.reduce((sum, l) => sum + l.amount_due, 0);
  const soldeAmount = totalAmount - scheduledTotal;

  if (soldeAmount > 0) {
    const lastDue = addMonths(
      parseISO(firstDueDate),
      downPayment > 0 ? numMonths + 1 : numMonths
    );
    lines.push({
      label: "Solde",
      amount_due: soldeAmount,
      due_date: format(lastDue, "yyyy-MM-dd"),
    });
  }

  return lines;
}
