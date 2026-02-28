import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Bed, Bath, Square, Heart } from 'lucide-react';

interface Property {
    id: string;
    title: string;
    description: string;
    price: number;
    address: string;
    city: string;
    bedrooms: number;
    bathrooms: number;
    hasPrivateBathroom?: boolean;
    area: number;
    image_url: string;
    status: string;
    latitude: number;
    longitude: number;
}

interface PropertyCardProps {
    property: Property;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
}

export default function PropertyCard({ property, isFavorite, onToggleFavorite }: PropertyCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative">
            <Link href={`/properties/${property.id}`} className="block relative h-48 w-full overflow-hidden">
                <img
                    src={property.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80'}
                    alt={property.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-md shadow-sm ${property.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {property.status}
                    </span>
                </div>
            </Link>

            {onToggleFavorite && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleFavorite(property.id);
                    }}
                    className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
                >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
            )}

            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate pr-4">
                        <Link href={`/properties/${property.id}`} className="hover:text-blue-600">
                            {property.title}
                        </Link>
                    </h3>
                    <p className="text-xl font-bold text-blue-600">${property.price.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                </div>

                <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{property.address}, {property.city}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center text-gray-600 text-sm">
                        <Bed className="h-4 w-4 mr-1.5 text-blue-500" />
                        {property.bedrooms} Ngủ
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                        <Bath className="h-4 w-4 mr-1.5 text-blue-500" />
                        {property.hasPrivateBathroom ? 'Khép kín' : 'Chung'}
                    </div>
                    <div className="flex items-center text-gray-600 text-sm col-span-2">
                        <Square className="h-4 w-4 mr-1.5 text-blue-500" />
                        {property.area} m² Diện tích
                    </div>
                </div>
            </div>
        </div>
    );
}
