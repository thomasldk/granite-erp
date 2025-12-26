
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const palletNumber = 4; // P25-0004
    const pallet = await prisma.pallet.findFirst({
        where: { number: palletNumber },
        include: {
            workOrder: {
                include: {
                    quote: {
                        include: {
                            client: true
                        }
                    }
                }
            },
            deliveryItem: true,
            items: true
        }
    });

    if (!pallet) {
        console.log(`Pallet P25-${palletNumber} not found.`);
        return;
    }

    console.log("Pallet Found:", {
        id: pallet.id,
        number: pallet.number,
        status: pallet.status,
        deliveryItem: pallet.deliveryItem, // Should be null if available
        clientName: pallet.workOrder?.quote?.client?.name,
        clientId: pallet.workOrder?.quote?.client?.id
    });

    // Check if there are ANY delivery notes for this client
    const notes = await prisma.deliveryNote.findMany({
        where: { clientId: pallet.workOrder?.quote?.client?.id },
        include: { items: { include: { pallet: true } } }
    });

    console.log(`Delivery Notes for Client '${pallet.workOrder?.quote?.client?.name}':`, notes.map(n => ({
        id: n.id,
        status: n.status,
        palletNumbers: n.items.map(i => i.pallet?.number)
    })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
