import { addMonths, format, parseISO } from "date-fns";
import type { ScheduleLineType } from "@/types/database";

export interface ScheduleLineInput {
  due_date: string;
  amount_due: number;
  label: string;
  line_type: ScheduleLineType;
}

export interface GenerateScheduleParams {
  totalAmount: number;
  downPayment: number;
  numMonths: number;
  firstDueDate: string;
  paymentMode?: "cash" | "echelonne";
}

export function generatePaymentSchedule(
  params: GenerateScheduleParams
): ScheduleLineInput[] {
  const { totalAmount, downPayment, numMonths, firstDueDate, paymentMode } = params;

  if (paymentMode === "cash" || downPayment >= totalAmount) {
    return [
      {
        label: "Paiement comptant",
        amount_due: totalAmount,
        due_date: firstDueDate,
        line_type: "cash",
      },
    ];
  }

  const remaining = totalAmount - downPayment;
  const monthlyAmount = numMonths > 0 ? Math.floor(remaining / (numMonths + 1)) : 0;
  const lines: ScheduleLineInput[] = [];

  if (downPayment > 0) {
    lines.push({
      label: "Acompte",
      amount_due: downPayment,
      due_date: firstDueDate,
      line_type: "acompte",
    });
  }

  for (let i = 0; i < numMonths; i++) {
    const dueDate = addMonths(parseISO(firstDueDate), downPayment > 0 ? i + 1 : i);
    lines.push({
      label: `Mensualité ${i + 1}/${numMonths}`,
      amount_due: monthlyAmount,
      due_date: format(dueDate, "yyyy-MM-dd"),
      line_type: "mensualite",
    });
  }

  const scheduledTotal = lines.reduce((sum, l) => sum + l.amount_due, 0);
  const reliquatAmount = totalAmount - scheduledTotal;

  if (reliquatAmount > 0) {
    const lastDue = addMonths(
      parseISO(firstDueDate),
      downPayment > 0 ? numMonths + 1 : numMonths
    );
    lines.push({
      label: "Reliquat",
      amount_due: reliquatAmount,
      due_date: format(lastDue, "yyyy-MM-dd"),
      line_type: "reliquat",
    });
  }

  return lines;
}
