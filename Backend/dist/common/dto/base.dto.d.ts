export declare class BaseResponseDto {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}
export declare class PaginationDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare class PaginatedResponseDto extends BaseResponseDto {
    pagination: PaginationDto;
}
