class ApiResponse {
    public statusCode: number;
    public message: string;
    public data: any;
    public success: boolean;


    constructor(status: number, data: any, message: string ) {
        this.statusCode = status;
        this.message = message;
        this.data = data;
        this.success = status < 400;
    }
}

export { ApiResponse }