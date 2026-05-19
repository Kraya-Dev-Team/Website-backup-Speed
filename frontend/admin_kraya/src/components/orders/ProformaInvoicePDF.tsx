import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Order } from '@/lib/api/orders';

// Register a nice font if possible, but standard Helvetica is fine for now
// Font.register({ family: 'Helvetica-Bold', fontWeight: 'bold' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2C1810',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '1px solid #E5E5E5',
    paddingBottom: 20,
  },
  logoSection: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#9C6D3B', // Brand gold color
  },
  subtitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#8B735B',
  },
  invoiceDetails: {
    textAlign: 'right',
  },
  invoiceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  addressBox: {
    width: '45%',
  },
  addressTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    color: '#8B735B',
  },
  addressText: {
    lineHeight: 1.4,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9F8F6',
    borderBottom: '1px solid #2C1810',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #F0F0F0',
    padding: 8,
    alignItems: 'center',
  },
  col1: { width: '50%' },
  col2: { width: '10%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '1px solid #F0F0F0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '2px solid #2C1810',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1px solid #E5E5E5',
    paddingTop: 20,
    color: '#8B735B',
    fontSize: 8,
  }
});

export const ProformaInvoicePDF = ({ order }: { order: Order }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Text style={styles.title}>KRAYA</Text>
          <Text style={styles.subtitle}>The Art of Invisible Luxury</Text>
        </View>
        <View style={styles.invoiceDetails}>
          <Text style={styles.invoiceLabel}>PROFORMA INVOICE</Text>
          <Text>Number: #INV-{order._id?.slice(-6).toUpperCase()}</Text>
          <Text>Date: {new Date(order.createdAt).toLocaleDateString()}</Text>
          <Text>Status: {order.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Addresses */}
      <View style={styles.addressSection}>
        <View style={styles.addressBox}>
          <Text style={styles.addressTitle}>Bill To</Text>
          {order.shippingAddress ? (
            <>
              <Text style={[styles.addressText, { fontWeight: 'bold' }]}>
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </Text>
              <Text style={styles.addressText}>{order.shippingAddress.addressLine1}</Text>
              {order.shippingAddress.addressLine2 && <Text style={styles.addressText}>{order.shippingAddress.addressLine2}</Text>}
              <Text style={styles.addressText}>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</Text>
              <Text style={styles.addressText}>Phone: {order.shippingAddress.phone}</Text>
            </>
          ) : (
            <Text style={styles.addressText}>No address provided</Text>
          )}
        </View>
        <View style={styles.addressBox}>
          <Text style={styles.addressTitle}>Sold By</Text>
          <Text style={[styles.addressText, { fontWeight: 'bold' }]}>KRAYA LUXURY PERFUMES</Text>
          <Text style={styles.addressText}>123 Artisan Valley, Scent Tower</Text>
          <Text style={styles.addressText}>Mumbai, Maharashtra - 400001</Text>
          <Text style={styles.addressText}>GSTIN: 27AAACK1234A1Z5</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Item Description</Text>
          <Text style={styles.col2}>Qty</Text>
          <Text style={styles.col3}>Price</Text>
          <Text style={styles.col4}>Total</Text>
        </View>
        {order.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={{ fontWeight: 'bold' }}>{item.productName}</Text>
              <Text style={{ fontSize: 8, color: '#8B735B' }}>Size: {item.variantSize} | SKU: {item.sku}</Text>
            </View>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>₹{item.price.toLocaleString()}</Text>
            <Text style={styles.col4}>₹{item.total.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>₹{order.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Tax (GST 18%)</Text>
            <Text>₹{order.tax.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Shipping</Text>
            <Text>₹{order.shippingCost.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#D32F2F' }}>Discount</Text>
            <Text style={{ color: '#D32F2F' }}>-₹{order.discount?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total Payable</Text>
            <Text>₹{order.total.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>This is a computer generated proforma invoice. No signature is required.</Text>
        <Text style={{ marginTop: 4 }}>Thank you for choosing Kraya. Experience the essence of luxury.</Text>
      </View>
    </Page>
  </Document>
);
