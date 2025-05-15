type StatusEnum__1 = 'NOT_SENT' | 'DELIVERED_IN_PVZ' | 'RECEIVED';
export type productType = {
    id: number
    articul: string
    discr: string
    supply_id: number | null
    status: StatusEnum__1
}