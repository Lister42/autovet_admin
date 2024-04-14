import Image from "next/image";

interface Props {
    image: string;
    //size_in_rems: number; // Removed because of weird bug that would sometimes enlarge image
}

export default function Avatar(props: Props) {
    return(
    <div className="avatar">
        <div className={`rounded-full`}>
            <Image src={props.image} alt="avatar" width={64} height={64} />
        </div>
    </div>
    );
}