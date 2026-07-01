// assets/assets.ts

// --- Image Paths (Referenced directly from public/images) ---
// IMPORTANT: All these images should be placed in your `public/images` folder.
// We are exporting their direct paths as strings, not importing them as modules.

// SVG Icons
export const logo = "/images/seller-logo.svg";
export const search_icon = "/images/search_icon.svg";
export const user_icon = "/images/user_icon.svg";
export const cart_icon = "/images/cart_icon.svg";
export const add_icon = "/images/add_icon.svg";
export const order_icon = "/images/order_icon.svg";
export const instagram_icon = "/images/instagram_icon.svg";
export const facebook_icon = "/images/facebook_icon.svg";
export const twitter_icon = "/images/twitter_icon.svg";
export const box_icon = "/images/box_icon.svg";
export const product_list_icon = "/images/product_list_icon.svg";
export const menu_icon = "/images/menu_icon.svg";
export const arrow_icon = "/images/arrow_icon.svg";
export const increase_arrow = "/images/increase_arrow.svg";
export const decrease_arrow = "/images/decrease_arrow.svg";
export const arrow_right_icon_colored = "/images/arrow_right_icon_colored.svg";
export const my_location_image = "/images/my_location_image.svg";
export const arrow_icon_white = "/images/arrow_icon_white.svg";
export const heart_icon = "/images/heart_icon.svg";
export const star_icon = "/images/star_icon.svg";
export const redirect_icon = "/images/redirect_icon.svg";
export const star_dull_icon = "/images/star_dull_icon.svg";

// PNG Images
export const header_ordi_hp_probook_image = "/images/header_ordi_hp_probook_image.png";
export const header_casque_image = "/images/header_casque_image.png";
export const header_tv_image = "/images/header_tv_image.png";
export const macbook_image = "/images/macbook_image.png";
export const bose_headphone_image = "/images/bose_headphone_image.png";
export const apple_earphone_image = "/images/apple_earphone_image.png";
export const samsung_s23phone_image = "/images/samsung_s23phone_image.png";
export const venu_watch_image = "/images/venu_watch_image.png";
export const upload_area = "/images/upload_area.png";
export const cannon_camera_image = "/images/cannon_camera_image.png";
export const sony_airbuds_image = "/images/sony_airbuds_image.png";
export const asus_laptop_image = "/images/asus_laptop_image.png";
export const projector_image = "/images/projector_image.png";
export const playstation_image = "/images/playstation_image.png";
export const girl_with_headphone_image = "/images/girl_with_headphone_image.png";
export const girl_with_earphone_image = "/images/girl_with_earphone_image.png";
export const banner_bg2_image = "/images/banner_bg2_image.png";
export const sm_controller_image = "/images/sm_controller_image.png";
export const banner_bg1_image = "/images/banner_bg1_image.png";
export const boy_with_laptop_image = "/images/boy_with_laptop_image.png";
export const checkmark = "/images/checkmark.png";
export const product_details_page_apple_earphone_image1 = "/images/product_details_page_apple_earphone_image1.png";
export const product_details_page_apple_earphone_image2 = "/images/product_details_page_apple_earphone_image2.png";
export const product_details_page_apple_earphone_image3 = "/images/product_details_page_apple_earphone_image3.png";
export const product_details_page_apple_earphone_image4 = "/images/product_details_page_apple_earphone_image4.png";
export const product_details_page_apple_earphone_image5 = "/images/product_details_page_apple_earphone_image5.png";
export const default_product_image = "/images/default_product_image.png"; // Make sure this image exists in public/images

// --- Exported Assets Object ---
export const assets = {
    logo,
    search_icon,
    user_icon,
    cart_icon,
    add_icon,
    order_icon,
    instagram_icon,
    facebook_icon,
    twitter_icon,
    box_icon,
    product_list_icon,
    menu_icon,
    arrow_icon,
    increase_arrow,
    decrease_arrow,
    arrow_right_icon_colored,
    my_location_image,
    arrow_icon_white,
    heart_icon,
    star_icon,
    redirect_icon,
    star_dull_icon,
    header_ordi_hp_probook_image,
    header_casque_image,
    header_tv_image,
    macbook_image,
    bose_headphone_image,
    apple_earphone_image,
    samsung_s23phone_image,
    venu_watch_image,
    upload_area,
    cannon_camera_image,
    sony_airbuds_image,
    asus_laptop_image,
    projector_image,
    playstation_image,
    girl_with_headphone_image,
    girl_with_earphone_image,
    banner_bg2_image,
    sm_controller_image,
    banner_bg1_image,
    boy_with_laptop_image,
    product_details_page_apple_earphone_image1,
    product_details_page_apple_earphone_image2,
    product_details_page_apple_earphone_image3,
    product_details_page_apple_earphone_image4,
    product_details_page_apple_earphone_image5,
    checkmark,
    default_product_image,
};

// --- TypeScript Interfaces for Dummy Data ---

// Interface for a single product
export interface Product {
    id: string; // Changed from _id to id for consistency with Prisma/NextAuth
    userId: string;
    name: string;
    description: string;
    price: number;
    offerPrice?: number; // Made optional as it might not always be present, and can be 0 or null if not an offer
    image: string[]; // Array of image URLs
    category: string;
    date: number; // Unix timestamp
    rating?: number; // Optional rating
    // __v: number; // __v is typically for MongoDB/Mongoose, not needed for Prisma/SQL
}

// Interface for a user
export interface User {
    id: string; // Changed from _id to id for consistency with Prisma/NextAuth
    name: string;
    email: string;
    imageUrl?: string; // Made optional, as it might not always be present
    cartItems: { [productId: string]: number }; // Object where keys are product IDs and values are quantities
    // __v: number; // Not needed for Prisma/SQL
}

// Interface for an address within an order
export interface OrderAddress {
    id: string; // Changed from _id to id for consistency
    userId: string;
    fullName: string;
    phoneNumber: string;
    pincode: number;
    area: string;
    city: string;
    state: string;
    // __v: number; // Not needed for Prisma/SQL
}

// Interface for an item within an order
export interface OrderItem {
    product: Product; // Full product details nested
    quantity: number;
    id: string; // Changed from _id to id for consistency
}

// Interface for an order
export interface Order {
    id: string; // Changed from _id to id for consistency
    userId: string;
    items: OrderItem[];
    amount: number;
    address: OrderAddress;
    status: string;
    date: number; // Unix timestamp
    // __v: number; // Not needed for Prisma/SQL
}

// --- Dummy Data (Typed) ---

export const productsDummyData: Product[] = [
    {
        id: "67a1f4e43f34a77b6dde9144", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Apple AirPods Pro 2nd gen",
        description: "Apple AirPods Pro (2nd Gen) with MagSafe Case (USB-C) provide excellent sound, active noise cancellation, and a comfortable fit. The USB-C case ensures quick charging, and they pair seamlessly with Apple devices for an effortless audio experience.",
        price: 499.99,
        offerPrice: 399.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/k4dafzhwhgcn5tnoylrw.webp",
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/j212frakb8hdrhvhajhg.webp",
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/imwuugqxsajuwqpkegb5.webp",
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/k1oqaslw5tb3ebw01vvj.webp",
        ],
        category: "Earphone",
        date: 1738667236865,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f52e3f34a77b6dde914a", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Bose QuietComfort 45",
        description: "The Bose QuietComfort 45 headphones are engineered for exceptional sound quality and unparalleled noise cancellation. With a 24-hour battery life and comfortable, lightweight design, these headphones deliver premium audio for any environment. Whether on a flight, in the office, or at home, the Bose QC45 blocks out distractions, offering an immersive listening experience.",
        price: 429.99,
        offerPrice: 329.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/m16coelz8ivkk9f0nwrz.webp",
        ],
        category: "Headphone",
        date: 1738667310300,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f5663f34a77b6dde914c", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Samsung Galaxy S23",
        description: "The Samsung Galaxy S23 offers an all-encompassing mobile experience with its advanced AMOLED display, offering vibrant visuals and smooth interactions. Equipped with top-of-the-line fitness tracking features and cutting-edge technology, this phone delivers outstanding performance. With powerful hardware, a sleek design, and long battery life, the S23 is perfect for those who demand the best in mobile innovation.",
        price: 899.99,
        offerPrice: 799.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/xjd4eprpwqs7odbera1w.webp",
        ],
        category: "Smartphone",
        date: 1738667366224,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f5993f34a77b6dde914e", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Garmin Venu 2",
        description: "The Garmin Venu 2 smartwatch blends advanced fitness tracking with sophisticated design, offering a wealth of features such as heart rate monitoring, GPS, and sleep tracking. Built with a 24-hour battery life, this watch is ideal for fitness enthusiasts and anyone looking to enhance their daily lifestyle. With a stunning AMOLED display and customizable watch faces, the Venu 2 combines technology with style seamlessly.",
        price: 399.99,
        offerPrice: 349.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/hdfi4u3fmprazpnrnaga.webp",
        ],
        category: "Earphone", // Correct this category if it's a smartwatch
        date: 1738667417511,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f5ef3f34a77b6dde9150", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "PlayStation 5",
        description: "The PlayStation 5 takes gaming to the next level with ultra-HD graphics, a powerful 825GB SSD, and ray tracing technology for realistic visuals. Whether you're into high-action games or immersive storytelling, the PS5 delivers fast loading times, seamless gameplay, and stunning visuals. It's a must-have for any serious gamer looking for the ultimate gaming experience.",
        price: 599.99,
        offerPrice: 499.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/dd3l13vfoartrgbvkkh5.webp",
        ],
        category: "Accessories", // Correct this category if it's a gaming console
        date: 1738667503075,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f70c3f34a77b6dde9156", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Canon EOS R5",
        description: "The Canon EOS R5 is a game-changing mirrorless camera with a 45MP full-frame sensor, offering ultra-high resolution and the ability to shoot 8K video. Whether you're capturing professional-quality stills or cinematic video footage, this camera delivers exceptional clarity, speed, and color accuracy. With advanced autofocus and in-body stabilization, the R5 is ideal for photographers and videographers alike.",
        price: 4199.99,
        offerPrice: 3899.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/r5h370zuujvrw461c6wy.webp",
        ],
        category: "Camera",
        date: 1738667788883,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f7c93f34a77b6dde915a", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "MacBook Pro 16",
        description: "The MacBook Pro 16, powered by Apple's M2 Pro chip, offers outstanding performance with 16GB RAM and a 512GB SSD. Whether you're editing high-resolution video, developing software, or multitasking with ease, this laptop can handle the toughest tasks. It features a stunning Retina display with True Tone technology, making it a top choice for professionals in creative industries or anyone who demands premium performance in a portable form.",
        price: 2799.99,
        offerPrice: 2499.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/rzri7kytphxalrm9rubd.webp",
        ],
        category: "Laptop",
        date: 1738667977644,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f8363f34a77b6dde915c", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Sony WF-1000XM5",
        description: "Sony WF-1000XM5 true wireless earbuds deliver immersive sound with Hi-Res Audio and advanced noise cancellation technology. Designed for comfort and quality, they provide a stable, snug fit for a secure listening experience. Whether you're working out or traveling, these earbuds will keep you connected with the world around you while enjoying rich, clear sound.",
        price: 349.99,
        offerPrice: 299.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/e3zjaupyumdkladmytke.webp",
        ],
        category: "Earphone",
        date: 1738668086331,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1f85e3f34a77b6dde915e", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "Samsung Projector 4k",
        description: "The Samsung 4K Projector offers an immersive cinematic experience with ultra-high-definition visuals and realistic color accuracy. Equipped with a built-in speaker, it delivers rich sound quality to complement its stunning 4K resolution. Perfect for movie nights, gaming, or presentations, this projector is the ultimate choice for creating an at-home theater experience or professional setting.",
        price: 1699.99,
        offerPrice: 1499.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/qqdcly8a8vkyciy9g0bw.webp",
        ],
        category: "Accessories", // Correct this category if it's a projector
        date: 1738668126660,
        rating: 4.5,
        // __v: 0,
    },
    {
        id: "67a1fa4b3f34a77b6dde9166", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        name: "ASUS ROG Zephyrus G16",
        description: "The ASUS ROG Zephyrus G16 gaming laptop is powered by the Intel Core i9 processor and features an RTX 4070 GPU, delivering top-tier gaming and performance. With 16GB of RAM and a 1TB SSD, this laptop is designed for gamers who demand extreme power, speed, and storage. Equipped with a stunning 16-inch display, it's built to handle the most demanding titles and applications with ease.",
        price: 2199.99,
        offerPrice: 1999.99,
        image: [
            "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/wig1urqgnkeyp4t2rtso.webp",
        ],
        category: "Laptop",
        date: 1738668619198,
        rating: 4.5,
        // __v: 0,
    },
];

export const userDummyData: User = {
    id: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw", // Changed _id to id
    name: "GreatStack",
    email: "admin@example.com",
    imageUrl:
        "https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18ycnlnUnFiUDBYT2dEZ2h1ZmRXcGlpdWV5OXoiLCJyaWQiOiJ1c2VyXzJzWkZIUzFVSUl5c0p5RFZ6Q3BRaFVoVElodyJ9",
    cartItems: {
        // "67a1f4e43f34a77b6dde9144": 3 // Example item in cart, uncomment if needed
    },
    // __v: 0,
};

export const orderDummyData: Order[] = [
    {
        id: "67a20934b3db72db5cc77b2b", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        items: [
            {
                product: {
                    id: "67a1f4e43f34a77b6dde9144", // Changed _id to id
                    userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
                    name: "Apple AirPods Pro",
                    description: "Apple AirPods Pro (2nd Gen) with MagSafe Case (USB-C) provide excellent sound, active noise cancellation, and a comfortable fit. The USB-C case ensures quick charging, and they pair seamlessly with Apple devices for an effortless audio experience.",
                    price: 499.99,
                    offerPrice: 399.99,
                    image: [
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667237/lrllaprpos2pnp5c9pyy.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667238/jqotgy2rvm36vfjv6lxl.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667238/niw7tqxvjsxt7wcehxeo.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667237/h8cq4x9cfzqzwaiarvpk.png",
                    ],
                    category: "Earphone",
                    date: 1738667236865,
                    // __v: 0,
                },
                quantity: 1,
                id: "67a20934b3db72db5cc77b2c", // Changed _id to id
            },
        ],
        amount: 406.99,
        address: {
            id: "67a1e4233f34a77b6dde9055", // Changed _id to id
            userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
            fullName: "GreatStack",
            phoneNumber: "0123456789",
            pincode: 654321,
            area: "Main Road , 123 Street, G Block",
            city: "City",
            state: "State",
            // __v: 0,
        },
        status: "Order Placed",
        date: 1738672426822,
        // __v: 0,
    },
    {
        id: "67a20949b3db72db5cc77b2e", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        items: [
            {
                product: {
                    id: "67a1f52e3f34a77b6dde914a", // Changed _id to id
                    userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
                    name: "Bose QuietComfort 45",
                    description: "The Bose QuietComfort 45 headphones are engineered for exceptional sound quality and unparalleled noise cancellation. With a 24-hour battery life and comfortable, lightweight design, these headphones deliver premium audio for any environment. Whether on a flight, in the office, or at home, the Bose QC45 blocks out distractions, offering an immersive listening experience.",
                    price: 429.99,
                    offerPrice: 329.99,
                    image: [
                        "https://raw.githubusercontent.com/avinashdm/gs-images/main/quickcart/m16coelz8ivkk9f0nwrz.webp",
                    ],
                    category: "Headphone",
                    date: 1738667310300,
                    // __v: 0,
                },
                quantity: 1,
                id: "67a20949b3db72db5cc77b2f", // Changed _id to id
            },
        ],
        amount: 335.99,
        address: {
            id: "67a1e4233f34a77b6dde9055", // Changed _id to id
            userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
            fullName: "GreatStack",
            phoneNumber: "0123456789",
            pincode: 654321,
            area: "Main Road , 123 Street, G Block",
            city: "City",
            state: "State",
            // __v: 0,
        },
        status: "Order Placed",
        date: 1738672448031,
        // __v: 0,
    },
    {
        id: "67a209bab3db72db5cc77b34", // Changed _id to id
        userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
        items: [
            {
                product: {
                    id: "67a1f4e43f34a77b6dde9144", // Changed _id to id
                    userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
                    name: "Apple AirPods Pro",
                    description: "Apple AirPods Pro (2nd Gen) with MagSafe Case (USB-C) provide excellent sound, active noise cancellation, and a comfortable fit. The USB-C case ensures quick charging, and they pair seamlessly with Apple devices for an effortless audio experience.",
                    price: 499.99,
                    offerPrice: 399.99,
                    image: [
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667237/lrllaprpos2pnp5c9pyy.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667238/jqotgy2rvm36vfjv6lxl.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667238/niw7tqxvjsxt7wcehxeo.png",
                        "https://res.cloudinary.com/djbvf02yt/image/upload/v1738667237/h8cq4x9cfzqzwaiarvpk.png",
                    ],
                    category: "Earphone",
                    date: 1738667236865,
                    // __v: 0,
                },
                quantity: 1,
                id: "67a209bab3db72db5cc77b35", // Changed _id to id
            },
        ],
        amount: 406.99,
        address: {
            id: "67a1e4233f34a77b6dde9055", // Changed _id to id
            userId: "user_2sZFHS1UIIysJyDVzCpQhUhTIhw",
            fullName: "GreatStack",
            phoneNumber: "0123456789",
            pincode: 654321,
            area: "Main Road , 123 Street, G Block",
            city: "City",
            state: "State",
            // __v: 0,
        },
        status: "Order Placed",
        date: 1738672560698,
        // __v: 0,
    },
];

// Re-exporting the icon components as before (assuming they are now in components/Icons.tsx)
// If you want them to be accessible from `assets.ts`, you would import them here.
// However, it's generally better to import icons from a dedicated icons file.
// For now, I'm keeping them commented out here, assuming they remain in `components/Icons.tsx` as discussed.
/*
export const BagIcon = () => {
    return (
        <svg className="w-5 h-5 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 10V6a3 3 0 0 1 3-3v0a3 3 0 0 1 3 3v4m3-2 .917 11.923A1 1 0 0 1 17.92 21H6.08a1 1 0 0 1-.997-1.077L6 8h12Z" />
        </svg>
    )
}

export const CartIcon = () => {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.75 0.75H3.75L5.76 10.7925C5.82858 11.1378 6.01643 11.448 6.29066 11.6687C6.56489 11.8895 6.90802 12.0067 7.26 12H14.55C14.902 12.0067 15.2451 11.8895 15.5193 11.6687C15.7936 11.448 15.9814 11.1378 16.05 10.7925L17.25 4.5H4.5M7.5 15.75C7.5 16.1642 7.16421 16.5 6.75 16.5C6.33579 16.5 6 16.1642 6 15.75C6 15.3358 6.33579 15 6.75 15C7.16421 15 7.75 15.3358 7.5 15.75ZM15.75 15.75C15.75 16.1642 15.4142 16.5 15 16.5C14.5858 16.5 14.25 16.1642 14.25 15.75C14.25 15.3358 14.5858 15 15 15C15.4142 15 15.75 15.3358 15.75 15.75Z" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
                <rect width="18" height="18" fill="white" />
            </defs>
        </svg>
    )
}

export const BoxIcon = () => (
    <svg className="w-5 h-5 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 21v-9m3-4H7.5a2.5 2.5 0 1 1 0-5c1.5 0 2.875 1.25 3.875 2.5M14 21v-9m-9 0h14v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8ZM4 8h16a1 1 0 0 1 1 1v3H3V9a1 1 0 0 1 1-1Zm12.155-5c-3 0-5.5 5-5.5 5h5.5a2.5 2.5 0 0 0 0-5Z" />
    </svg>
);

export const HomeIcon = () => (
    <svg className="w-5 h-5 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" >
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5" />
    </svg>
);
*/
