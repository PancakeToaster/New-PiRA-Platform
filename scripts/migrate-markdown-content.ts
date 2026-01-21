import { PrismaClient } from '@prisma/client';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

const prisma = new PrismaClient();

/**
 * This script converts Tiptap JSON content that contains raw markdown text
 * into properly formatted Tiptap JSON with semantic nodes (headings, lists, etc.)
 */
async function migrateMarkdownContent() {
    console.log('🔄 Starting markdown content migration...');

    // Find all nodes with markdown type
    const nodes = await prisma.knowledgeNode.findMany({
        where: {
            nodeType: 'markdown'
        }
    });

    console.log(`📄 Found ${nodes.length} markdown nodes`);

    let migrated = 0;
    let skipped = 0;

    for (const node of nodes) {
        try {
            const content = node.content;

            // Parse the JSON
            const parsed = JSON.parse(content);

            // Check if it's Tiptap JSON with plain text that looks like markdown
            if (parsed?.type === 'doc' && parsed?.content) {
                // Extract all text content
                let hasMarkdownSyntax = false;
                const textContent = extractText(parsed);

                // Check if it contains markdown syntax
                if (textContent.includes('#') || textContent.includes('*') || textContent.includes('-')) {
                    hasMarkdownSyntax = true;
                }

                if (hasMarkdownSyntax) {
                    console.log(`\n🔧 Migrating node: ${node.id} - "${node.title}"`);
                    console.log(`   Text preview: ${textContent.substring(0, 100)}...`);

                    // For now, just log - we'll need to manually convert or use a markdown parser
                    console.log(`   ⚠️  This node needs manual conversion or a markdown-to-tiptap parser`);
                    skipped++;
                } else {
                    skipped++;
                }
            }
        } catch (error) {
            console.error(`❌ Error processing node ${node.id}:`, error);
            skipped++;
        }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);

    await prisma.$disconnect();
}

function extractText(node: any): string {
    let text = '';

    if (node.type === 'text') {
        return node.text || '';
    }

    if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
            text += extractText(child);
        }
    }

    return text;
}

migrateMarkdownContent().catch(console.error);
