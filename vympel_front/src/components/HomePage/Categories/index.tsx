'use client'

import React from 'react';
import {CategoriesConfig} from "@/components/HomePage/Categories/config";
import CategoriesItem from "@/components/HomePage/Categories/Item";

const Categories = () => {
    return (
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            {
                CategoriesConfig().map((item, index) => (
                    <CategoriesItem
                        key={index}
                        link={item.link}
                        img={item.img}
                        title={item.title}
                        imageClassName={item.imageClassName}
                    />
                ))
            }
        </div>
    );
};

export default Categories;
