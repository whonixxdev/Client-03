export declare class CreateJurusanDto {
    namaJurusan: string;
    kuota: number;
    biayaPendaftaran: number;
    aktif?: boolean;
}
declare const UpdateJurusanDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateJurusanDto>>;
export declare class UpdateJurusanDto extends UpdateJurusanDto_base {
}
export {};
