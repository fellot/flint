import { getDecemberFeatures } from '@/utils/excel';
import FeaturesTable from '@/components/FeaturesTable';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function DecemberFeaturesPage() {
    const wines = await getDecemberFeatures();

    return (
        <div className="min-h-screen bg-red-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-red-100 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Cellar
                    </Link>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        December Features
                    </h1>
                    <p className="mt-2 text-red-100 text-lg">
                        Explore the latest additions and features for December.
                    </p>
                </div>

                <FeaturesTable wines={wines} />
            </div>
        </div>
    );
}
