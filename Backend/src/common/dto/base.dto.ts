export class BaseResponseDto {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class PaginatedResponseDto extends BaseResponseDto {
  pagination: PaginationDto;
}
