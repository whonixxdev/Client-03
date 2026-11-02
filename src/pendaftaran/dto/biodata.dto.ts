import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const NOMOR_HP = /^(\+62|62|0)8\d{8,12}$/;

export class CreateBiodataDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi!' })
  @MaxLength(100)
  namaLengkap!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{16}$/, { message: 'NIK harus 16 digit angka.' })
  nik?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'NISN harus 10 digit angka.' })
  nisn?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{3,20}$/, { message: 'NIS harus 3-20 digit angka.' })
  nis?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Laki-laki', 'Perempuan'], { message: 'Jenis kelamin harus Laki-laki atau Perempuan.' })
  jenisKelamin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tempatLahir?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal lahir tidak valid.' })
  tanggalLahir?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'], {
    message: 'Agama tidak valid.',
  })
  agama?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  alamat?: string;

  @IsOptional()
  @IsString()
  @Matches(NOMOR_HP, { message: 'Format nomor HP siswa tidak valid.' })
  noHpSiswa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  namaAyah?: string;

  @IsOptional()
  @IsString()
  @Matches(NOMOR_HP, { message: 'Format nomor HP ayah tidak valid.' })
  noHpAyah?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  namaIbu?: string;

  @IsOptional()
  @IsString()
  @Matches(NOMOR_HP, { message: 'Format nomor HP ibu tidak valid.' })
  noHpIbu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  asalSmp?: string;

  @IsOptional()
  @IsUUID('all', { message: 'Jurusan utama tidak valid.' })
  jurusanId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'Jurusan cadangan tidak valid.' })
  jurusanCadanganId?: string;
}
