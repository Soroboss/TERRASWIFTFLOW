import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#666" },
  value: { fontWeight: "bold" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#ddd", marginVertical: 16 },
  amount: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginVertical: 12 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#888" },
});

export interface ReceiptPDFProps {
  organizationName: string;
  receiptNumber: string;
  paidAt: string;
  clientName: string;
  propertyTitle: string;
  amount: number;
  amountWords: string;
  method: string;
}

export function ReceiptPDFDocument(props: ReceiptPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>REÇU DE PAIEMENT</Text>
          <Text style={styles.subtitle}>{props.organizationName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>N° reçu</Text>
          <Text style={styles.value}>{props.receiptNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{props.paidAt}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Client</Text>
          <Text style={styles.value}>{props.clientName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bien</Text>
          <Text style={styles.value}>{props.propertyTitle}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Mode de paiement</Text>
          <Text style={styles.value}>{props.method}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.amount}>
          {new Intl.NumberFormat("fr-FR").format(props.amount).replace(/\u202f/g, " ")} FCFA
        </Text>
        <Text style={{ textAlign: "center", fontSize: 10, marginBottom: 20 }}>
          {props.amountWords}
        </Text>

        <Text style={styles.footer}>
          Document généré par TerraSwiftFlow — Côte d&apos;Ivoire
        </Text>
      </Page>
    </Document>
  );
}

export interface ContractScheduleLine {
  label: string;
  due_date: string;
  amount_due: number;
}

export interface ContractPDFProps {
  organizationName: string;
  clientName: string;
  clientPhone: string;
  propertyTitle: string;
  propertyReference: string;
  totalAmount: number;
  signedAt: string;
  schedules: ContractScheduleLine[];
}

export function ContractPDFDocument(props: ContractPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>CONTRAT DE VENTE</Text>
          <Text style={styles.subtitle}>{props.organizationName}</Text>
        </View>

        <Text style={{ marginBottom: 12 }}>
          Entre {props.organizationName} (ci-après « le Vendeur ») et {props.clientName},
          téléphone {props.clientPhone} (ci-après « l&apos;Acquéreur »).
        </Text>

        <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Article 1 — Objet</Text>
        <Text style={{ marginBottom: 12 }}>
          Le Vendeur cède à l&apos;Acquéreur le bien suivant : {props.propertyTitle}
          (réf. {props.propertyReference}).
        </Text>

        <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Article 2 — Prix</Text>
        <Text style={{ marginBottom: 12 }}>
          Prix total convenu :{" "}
          {new Intl.NumberFormat("fr-FR").format(props.totalAmount).replace(/\u202f/g, " ")} FCFA,
          payable selon l&apos;échéancier ci-dessous.
        </Text>

        <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Article 3 — Échéancier</Text>
        {props.schedules.map((s, i) => (
          <View key={i} style={styles.row}>
            <Text>{s.label} — {s.due_date}</Text>
            <Text>
              {new Intl.NumberFormat("fr-FR").format(s.amount_due).replace(/\u202f/g, " ")} FCFA
            </Text>
          </View>
        ))}

        <View style={styles.divider} />
        <Text style={{ fontSize: 9, marginTop: 8 }}>
          Date de signature : {props.signedAt}
        </Text>

        <Text style={styles.footer}>
          TerraSwiftFlow enregistre et assure le suivi des documents et informations fournis par le
          vendeur. L&apos;éditeur ne certifie pas et ne garantit pas la validité juridique des titres
          fonciers ou des transactions.
        </Text>
      </Page>
    </Document>
  );
}
