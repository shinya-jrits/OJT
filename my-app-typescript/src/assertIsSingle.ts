/**
 * filesが単数か確認する
 * @param files 確認するファイル
 */
export function assertIsSingle(files: FileList | null): asserts files is NonNullable<FileList> {
    if (files == null) {
        throw new Error(
            `filesが不正な値です,${files}でした`
        );
    } else if (files.length > 1) {
        throw new Error(
            `files.lengthが不正な値です,${files.length}でした`
        );
    }
}