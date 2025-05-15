export type driverWithInfoType = {
    id: number
    car_id: number | null
    user_id: number
    userInfo: {
        name: string,
        surname: string,
        last_name: string
    }
}