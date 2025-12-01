import React from 'react';

const CompanyCardSkeleton = () => {
    return (
        <tr className="animate-pulse border-b border-white/5 last:border-0">
            <td className="py-4 px-6">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10"></div>
                    <div className="h-4 w-32 bg-white/10 rounded"></div>
                </div>
            </td>
            <td className="py-4 px-6 hidden md:table-cell">
                <div className="h-4 w-24 bg-white/10 rounded"></div>
            </td>
            <td className="py-4 px-6 text-center">
                 <div className="h-4 w-8 bg-white/10 rounded mx-auto"></div>
            </td>
            <td className="py-4 px-6 text-center">
                <div className="h-6 w-20 bg-white/10 rounded-full mx-auto"></div>
            </td>
            <td className="py-4 px-6 text-right">
                <div className="h-8 w-24 bg-white/10 rounded-lg ml-auto"></div>
            </td>
        </tr>
    );
};

export default CompanyCardSkeleton;
