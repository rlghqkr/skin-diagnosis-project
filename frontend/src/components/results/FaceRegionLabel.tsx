import { FACEPART_LABELS } from "../../constants/skinMetrics";

interface Props {
  region: string;
}

export default function FaceRegionLabel({ region }: Props) {
  return (
    <span className="text-xs font-light tracking-wide text-white/35">
      {FACEPART_LABELS[region] ?? region}
    </span>
  );
}
