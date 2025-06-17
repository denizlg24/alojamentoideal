import { Card } from "./card";
import { FaRegStar, FaStar } from "react-icons/fa";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
export const ReviewCard = ({
  review,
}: {
  review: {
    name: string;
    guest_picture: string;
    created: string;
    comments: string;
    rating: number;
  };
}) => {
  return (
    <Card className="p-4 flex flex-col w-full col-span-full">
      <div className="flex flex-row gap-2 w-full truncate">
        <div className="h-auto aspect-square! rounded-full overflow-hidden min-w-10 max-w-10">
          <Avatar className="w-full h-auto aspect-square object-cover">
            <AvatarImage src={review.guest_picture} alt={review.name} />
            <AvatarFallback>
              {review.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="w-full flex flex-col justify-between truncate">
          <p className="truncate">{review.name}</p>
          <div className="grid grid-cols-5 w-[100px] gap-2 text-yellow-500">
            {[0, 1, 2, 3, 4].map((indx) => {
              if (indx + 1 <= review.rating) {
                return (
                  <FaStar className="w-full h-auto aspect-square" key={indx} />
                );
              }
              return (
                <FaRegStar className="w-full h-auto aspect-square" key={indx} />
              );
            })}
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col gap-2">
        <p>{review.comments}</p>
        <p className="text-xs">
          Written {format(new Date(review.created), "yyyy/MM/dd")}
        </p>
      </div>
    </Card>
  );
};
