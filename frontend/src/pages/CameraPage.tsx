import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CameraCapture from "../components/camera/CameraCapture";

export default function CameraPage() {
  const navigate = useNavigate();

  const handleCapture = useCallback(
    (file: File) => {
      navigate("/analysis", { state: { file } });
    },
    [navigate],
  );

  const handleCancel = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="px-4 py-4 pb-24">
      <CameraCapture onCapture={handleCapture} onCancel={handleCancel} />
    </div>
  );
}
