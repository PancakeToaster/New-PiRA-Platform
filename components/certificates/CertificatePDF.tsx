import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#0f172a', // dark navy
        padding: 0,
        fontFamily: 'Helvetica',
    },
    border: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        bottom: 20,
        borderWidth: 2,
        borderColor: '#38bdf8', // sky blue
        borderRadius: 4,
    },
    innerBorder: {
        position: 'absolute',
        top: 26,
        left: 26,
        right: 26,
        bottom: 26,
        borderWidth: 1,
        borderColor: '#0ea5e9',
        borderRadius: 2,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
    },
    headerLabel: {
        fontSize: 11,
        color: '#38bdf8',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 20,
    },
    orgName: {
        fontSize: 14,
        color: '#94a3b8',
        letterSpacing: 2,
        marginBottom: 32,
    },
    certTitle: {
        fontSize: 28,
        color: '#f8fafc',
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 28,
    },
    awardedToLabel: {
        fontSize: 11,
        color: '#64748b',
        letterSpacing: 2,
        marginBottom: 10,
    },
    studentName: {
        fontSize: 34,
        color: '#38bdf8',
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    divider: {
        width: 200,
        height: 1,
        backgroundColor: '#1e3a5f',
        marginBottom: 24,
    },
    completionText: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 8,
    },
    courseName: {
        fontSize: 16,
        color: '#e2e8f0',
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 32,
    },
    description: {
        fontSize: 10,
        color: '#64748b',
        textAlign: 'center',
        maxWidth: 400,
        lineHeight: 1.6,
        marginBottom: 40,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
        marginTop: 20,
    },
    footerLeft: {
        alignItems: 'flex-start',
    },
    footerRight: {
        alignItems: 'flex-end',
    },
    footerLabel: {
        fontSize: 9,
        color: '#475569',
        marginBottom: 4,
    },
    footerValue: {
        fontSize: 10,
        color: '#94a3b8',
    },
    codeBox: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 3,
        padding: '4 8',
        marginTop: 4,
    },
    codeText: {
        fontSize: 9,
        color: '#38bdf8',
        fontFamily: 'Courier',
        letterSpacing: 1,
    },
});

interface CertificatePDFProps {
    studentName: string;
    certificateTitle: string;
    courseName?: string;
    description?: string;
    awardedAt: Date;
    code: string;
}

export default function CertificatePDF({
    studentName,
    certificateTitle,
    courseName,
    description,
    awardedAt,
    code,
}: CertificatePDFProps) {
    const formattedDate = new Date(awardedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <Document
            title={`${certificateTitle} — ${studentName}`}
            author="PiRA Robotics Academy"
            subject="Certificate of Achievement"
        >
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.border} />
                <View style={styles.innerBorder} />

                <View style={styles.content}>
                    <Text style={styles.headerLabel}>Certificate of Achievement</Text>
                    <Text style={styles.orgName}>PiRA Robotics Academy</Text>

                    <Text style={styles.certTitle}>{certificateTitle}</Text>

                    <Text style={styles.awardedToLabel}>AWARDED TO</Text>
                    <Text style={styles.studentName}>{studentName}</Text>

                    <View style={styles.divider} />

                    {courseName && (
                        <>
                            <Text style={styles.completionText}>for successful completion of</Text>
                            <Text style={styles.courseName}>{courseName}</Text>
                        </>
                    )}

                    {description && (
                        <Text style={styles.description}>{description}</Text>
                    )}

                    <View style={styles.footer}>
                        <View style={styles.footerLeft}>
                            <Text style={styles.footerLabel}>DATE AWARDED</Text>
                            <Text style={styles.footerValue}>{formattedDate}</Text>
                        </View>
                        <View style={styles.footerRight}>
                            <Text style={styles.footerLabel}>VERIFICATION CODE</Text>
                            <View style={styles.codeBox}>
                                <Text style={styles.codeText}>{code}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
