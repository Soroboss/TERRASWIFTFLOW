import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ContractStage, ContractType } from "@/types/database";
import {
  CONTRACT_STAGE_LABELS,
  CONTRACT_TYPE_LABELS,
  contractTypeDescription,
  formatFcfaPdf,
} from "@/lib/sales-contract";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.45 },
  header: { marginBottom: 20 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 10, color: "#666", textAlign: "center" },
  articleTitle: { fontWeight: "bold", marginTop: 10, marginBottom: 4 },
  paragraph: { marginBottom: 8, textAlign: "justify" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#ddd", marginVertical: 14 },
  signature: { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  sigBlock: { width: "45%" },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 8, color: "#888" },
});

export interface ContractScheduleLine {
  label: string;
  due_date: string;
  amount_due: number;
  line_type?: string | null;
}

export interface SalesContractPDFProps {
  organizationName: string;
  organizationFooter?: string;
  clientName: string;
  clientPhone: string;
  propertyTitle: string;
  propertyReference: string;
  propertyType?: string;
  lotNumber?: string | null;
  totalAmount: number;
  depositAmount: number | null;
  balanceAmount: number | null;
  paymentMode: string;
  signedAt: string;
  contractType: ContractType;
  contractStage: ContractStage;
  schedules: ContractScheduleLine[];
}

function contractTitle(type: ContractType, stage: ContractStage): string {
  const typeLabel = CONTRACT_TYPE_LABELS[type].toUpperCase();
  const stageLabel = stage === "definitif" ? "DÉFINITIF" : "PROVISOIRE";
  return `CONTRAT ${stageLabel} — ${typeLabel}`;
}

export function SalesContractPDFDocument(props: SalesContractPDFProps) {
  const isDefinitive = props.contractStage === "definitif";
  const isCash = props.paymentMode === "cash";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {contractTitle(props.contractType, props.contractStage)}
          </Text>
          <Text style={styles.subtitle}>{props.organizationName}</Text>
          <Text style={styles.subtitle}>{CONTRACT_STAGE_LABELS[props.contractStage]}</Text>
        </View>

        <Text style={styles.paragraph}>
          Entre <Text style={{ fontWeight: "bold" }}>{props.organizationName}</Text> (ci-après « le
          Vendeur »), et <Text style={{ fontWeight: "bold" }}>{props.clientName}</Text>, joignable
          au {props.clientPhone} (ci-après « l&apos;Acquéreur »), il a été convenu ce qui suit.
        </Text>

        <Text style={styles.articleTitle}>Article 1 — Objet et nature du titre</Text>
        <Text style={styles.paragraph}>
          Le Vendeur cède à l&apos;Acquéreur le bien désigné : {props.propertyTitle}
          {props.lotNumber ? `, lot n° ${props.lotNumber}` : ""} (réf. {props.propertyReference}
          {props.propertyType ? `, ${props.propertyType}` : ""}), dans le cadre d&apos;une opération
          portant sur {contractTypeDescription(props.contractType)}.
        </Text>

        <Text style={styles.articleTitle}>Article 2 — Prix et modalités de paiement</Text>
        <Text style={styles.paragraph}>
          Prix total convenu : {formatFcfaPdf(props.totalAmount)}.
          {isCash
            ? " Paiement comptant intégral à la signature ou selon l'échéancier ci-dessous."
            : ` Acompte convenu : ${formatFcfaPdf(props.depositAmount ?? 0)}. Reliquat : ${formatFcfaPdf(props.balanceAmount ?? 0)}.`}
        </Text>

        {!isDefinitive && !isCash && (
          <Text style={styles.paragraph}>
            Le présent contrat provisoire prend effet à la réception de l&apos;acompte. Le contrat
            définitif sera établi et remis à l&apos;Acquéreur après paiement intégral du reliquat et
            des sommes dues au titre de la présente vente.
          </Text>
        )}

        {isDefinitive && (
          <Text style={styles.paragraph}>
            Le présent contrat définitif confirme la vente à titre {isCash ? "cash" : "échelonné"}.
            L&apos;Acquéreur reconnaît avoir réglé l&apos;intégralité des sommes dues ou s&apos;engage
            selon les stipulations ci-dessous pour les dernières échéances soldées.
          </Text>
        )}

        {isCash && !isDefinitive && (
          <Text style={styles.paragraph}>
            Le contrat définitif sera remis à l&apos;Acquéreur après encaissement du paiement
            comptant intégral.
          </Text>
        )}

        <Text style={styles.articleTitle}>Article 3 — Échéancier</Text>
        {props.schedules.length === 0 ? (
          <Text style={styles.paragraph}>Échéancier à convenir entre les parties.</Text>
        ) : (
          props.schedules.map((s, i) => (
            <View key={i} style={styles.row}>
              <Text>
                {s.label}
                {s.line_type === "reliquat" ? " (reliquat)" : ""} — {s.due_date}
              </Text>
              <Text>{formatFcfaPdf(s.amount_due)}</Text>
            </View>
          ))
        )}

        <Text style={styles.articleTitle}>Article 4 — Engagements</Text>
        <Text style={styles.paragraph}>
          Le Vendeur s&apos;engage à délivrer les documents requis pour la régularisation de la
          vente selon le régime applicable ({CONTRACT_TYPE_LABELS[props.contractType]}). L&apos;Acquéreur
          s&apos;engage à respecter l&apos;échéancier convenu et à ne pas céder le bien sans accord
          écrit du Vendeur tant que le reliquat n&apos;est pas soldé.
        </Text>

        <View style={styles.divider} />
        <Text style={{ fontSize: 9 }}>Date de signature : {props.signedAt}</Text>
        {props.organizationFooter && (
          <Text style={{ fontSize: 9, marginTop: 6 }}>{props.organizationFooter}</Text>
        )}

        <View style={styles.signature}>
          <View style={styles.sigBlock}>
            <Text style={{ fontWeight: "bold" }}>Le Vendeur</Text>
            <Text style={{ marginTop: 40, fontSize: 9 }}>{props.organizationName}</Text>
          </View>
          <View style={styles.sigBlock}>
            <Text style={{ fontWeight: "bold" }}>L&apos;Acquéreur</Text>
            <Text style={{ marginTop: 40, fontSize: 9 }}>{props.clientName}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          TerraSwiftFlow — suivi documentaire. L&apos;éditeur ne certifie pas la validité juridique
          des titres fonciers ; faites valider par un notaire ou juriste compétent en Côte
          d&apos;Ivoire.
        </Text>
      </Page>
    </Document>
  );
}
