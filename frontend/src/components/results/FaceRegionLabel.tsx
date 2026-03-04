import { FACEPART_LABELS } from "../../constants/skinMetrics";

interface Props {
  region: string;
}

export default function FaceRegionLabel({ region }: Props) {
  return (
    <span className="text-xs font-medium text-[#4E5968]">
      {FACEPART_LABELS[region] ?? region}
    </span>
  );
}
