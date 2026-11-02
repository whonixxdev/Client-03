export declare class CreateGelombangDto {
    nama: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    aktif?: boolean;
}
declare const UpdateGelombangDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateGelombangDto>>;
export declare class UpdateGelombangDto extends UpdateGelombangDto_base {
}
export {};
