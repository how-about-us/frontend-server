import { MapPin, Clock, Phone, Globe } from "lucide-react";

type Props = {
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  isOpen?: boolean;
};

export function InfoTab({ address, phone, hours, website, isOpen }: Props) {
  return (
    <div className="px-4 py-3">
      <h3 className="mb-3 text-[11px] font-semibold text-[#364153]">
        상세 정보
      </h3>
      <ul className="space-y-4">
        {address && (
          <li className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-dark-gray" />
            <div>
              <p className="text-[11px] font-medium text-[#364153]">주소</p>
              <p className="mt-0.5 text-[11px] text-dark-gray">{address}</p>
            </div>
          </li>
        )}
        {hours && (
          <li className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-dark-gray" />
            <div>
              <p className="text-[11px] font-medium text-[#364153]">
                영업시간{" "}
                {isOpen !== undefined && (
                  <span
                    className={`font-normal ${
                      isOpen ? "text-brand-green" : "text-[#FF6467]"
                    }`}
                  >
                    {isOpen ? "· 영업 중" : "· 영업 종료"}
                  </span>
                )}
              </p>
              <p className="mt-0.5 whitespace-pre-line text-[11px] text-dark-gray">
                {hours}
              </p>
            </div>
          </li>
        )}
        {phone && (
          <li className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-dark-gray" />
            <div>
              <p className="text-[11px] font-medium text-[#364153]">전화번호</p>
              <a
                href={`tel:${phone}`}
                className="mt-0.5 text-[11px] text-[#364153] underline-offset-2 hover:underline"
              >
                {phone}
              </a>
            </div>
          </li>
        )}
        {website && (
          <li className="flex items-start gap-3">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-dark-gray" />
            <div>
              <p className="text-[11px] font-medium text-[#364153]">웹사이트</p>
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 text-[11px] text-[#364153] underline-offset-2 hover:underline"
              >
                {website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
