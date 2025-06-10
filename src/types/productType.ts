export type StatusEnum__2 = 'NOT_SENT' | 'SENT_IN_PVZ' | 'DELIVERED_IN_PVZ' | 'RECEIVED';
export type productType = {
    id: number
    articul: string
    discr: string
    pick_up_point_id: number,
    supply_id: number | null
    status: StatusEnum__2
}