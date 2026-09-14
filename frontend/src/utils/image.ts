const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_WIDTH = 900;
const MAX_HEIGHT = 1200;

export async function optimizeCoverImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 선택할 수 있습니다.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("10MB 이하의 이미지를 선택해주세요.");
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    element.src = source;
  });

  const scale = Math.min(1, MAX_WIDTH / image.width, MAX_HEIGHT / image.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 처리하지 못했습니다.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}
