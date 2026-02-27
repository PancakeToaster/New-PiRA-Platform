/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed (standard fonts are built-in)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        paddingTop: 40,
        paddingBottom: 60,
        paddingLeft: 40,
        paddingRight: 40,
        lineHeight: 1.5,
        color: '#333333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    logo: {
        width: 100,
        height: 'auto',
        marginBottom: 5,
    },
    slogan: {
        color: '#D4AF37', // Gold/Yellow color from PDF
        fontSize: 10,
        fontWeight: 'bold',
    },
    companyInfo: {
        textAlign: 'right',
        fontSize: 9,
        color: '#111',
    },
    billTo: {
        marginTop: 20,
        marginBottom: 20,
    },
    billToName: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    invoiceTitleBlock: {
        marginTop: 10,
        marginBottom: 10,
    },
    invoiceTitle: {
        fontSize: 24,
        color: '#D4AF37', // Gold/Yellow
        fontWeight: 'bold',
    },
    dateBar: {
        backgroundColor: '#E6F3F5', // Light blue background
        flexDirection: 'row',
        padding: 10,
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 4,
    },
    dateCol: {
        width: '50%',
    },
    dateLabel: {
        fontSize: 10,
        color: '#0891b2', // Darker blue/teal for labels
        fontWeight: 'bold',
    },
    dateValue: {
        fontSize: 12,
        marginTop: 2,
    },
    table: {
        width: '100%',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 5,
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingTop: 5,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#F9F9F9',
    },
    colDesc: { width: '50%' },
    colQty: { width: '10%', textAlign: 'right' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTax: { width: '10%', textAlign: 'right' },
    colAmount: { width: '15%', textAlign: 'right' },

    totalsBlock: {
        marginTop: 10,
        marginLeft: 'auto',
        width: '45%',
        backgroundColor: '#F9F9F9',
        padding: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#DDD',
    },
    totalLabel: {
        fontWeight: 'bold',
        color: '#666',
    },
    totalValue: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    goldText: {
        color: '#D4AF37',
    },
    notesBox: {
        position: 'absolute',
        bottom: 70,
        left: 40,
        width: '50%',
        backgroundColor: '#F9F9F9',
        border: '1px solid #DDD',
        borderRadius: 4,
        padding: 10,
        fontSize: 8,
    },
    notesTitle: {
        fontWeight: 'bold',
        fontSize: 9,
        marginBottom: 5,
        color: '#333',
    },
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#E6F3F5', // Light blue wave mock
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 9,
        color: '#444',
        textAlign: 'center',
    },
});

interface InvoicePDFProps {
    invoice: any;
    logoSrc?: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (date: any) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
};

export default function InvoicePDF({ invoice, logoSrc = '/images/logo.png' }: InvoicePDFProps) {
    const parentName = invoice.parent
        ? `${invoice.parent.user.firstName} ${invoice.parent.user.lastName}`
        : 'Parent';

    // Default values if data missing
    const invoiceNumber = invoice.invoiceNumber || 'INV-000';
    const items = invoice.items || [];
    const tax = invoice.tax || 0;
    const subtotal = invoice.subtotal || invoice.total; // Fallback
    const total = invoice.total || 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Image src={logoSrc} style={styles.logo} />
                        <Text style={styles.slogan}>No limits, Just imagination.</Text>
                    </View>
                    <View style={styles.companyInfo}>
                        <Text>Playideas Robotics Academy</Text>
                        <Text>99 Jericho Tpke</Text>
                        <Text>Room 305</Text>
                        <Text>Jericho NY 11753</Text>
                        <Text>United States</Text>
                    </View>
                </View>

                {/* Bill To */}
                <View style={styles.billTo}>
                    <Text style={styles.billToName}>{parentName}</Text>
                </View>

                {/* Title */}
                <View style={styles.invoiceTitleBlock}>
                    <Text style={styles.invoiceTitle}>Invoice {invoiceNumber}</Text>
                </View>

                {/* Dates */}
                <View style={styles.dateBar}>
                    <View style={styles.dateCol}>
                        <Text style={styles.dateLabel}>Invoice Date</Text>
                        <Text style={styles.dateValue}>{formatDate(invoice.createdAt)}</Text>
                    </View>
                    <View style={styles.dateCol}>
                        <Text style={styles.dateLabel}>Due Date</Text>
                        <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colDesc}>Description</Text>
                        <Text style={styles.colQty}>Quantity</Text>
                        <Text style={styles.colPrice}>Unit Price</Text>
                        <Text style={styles.colTax}>Taxes</Text>
                        <Text style={styles.colAmount}>Amount</Text>
                    </View>
                    {items.map((item: any) => (
                        <View key={item.id} style={styles.tableRow}>
                            <View style={styles.colDesc}>
                                <Text>{item.description}</Text>
                                {item.student && (
                                    <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
                                        Student: {item.student.user.firstName} {item.student.user.lastName}
                                    </Text>
                                )}
                                {!!item.description && item.description.includes('Discount:') && (
                                    <Text style={{ fontSize: 8, color: '#D4AF37', marginTop: 2 }}>
                                        {item.description.split('Discount: ')[1]}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.colQty}>{item.quantity.toFixed(2)}</Text>
                            <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
                            <Text style={styles.colTax}></Text>
                            <Text style={styles.colAmount}>{formatCurrency(item.total)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsBlock}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Untaxed Amount</Text>
                        <Text>{formatCurrency(subtotal)}</Text>
                    </View>
                    {tax > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Tax</Text>
                            <Text>{formatCurrency(tax)}</Text>
                        </View>
                    )}
                    <View style={styles.grandTotalRow}>
                        <Text style={[styles.totalLabel, styles.goldText]}>Total</Text>
                        <Text style={[styles.totalValue, styles.goldText]}>{formatCurrency(total)}</Text>
                    </View>
                </View>

                {/* Notes Box - Left Corner Above Footer */}
                {invoice.notes && (
                    <View style={styles.notesBox}>
                        <Text style={styles.notesTitle}>Payment Information</Text>
                        <Text>{invoice.notes}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>917-285-5226</Text>
                    <Text style={styles.footerText}>info@playideasny.com</Text>
                </View>
            </Page>
        </Document>
    );
}
