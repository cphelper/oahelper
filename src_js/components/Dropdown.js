import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FaCaretDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { encryptId } from '../utils/encryption';

const Dropdown = ({ questions }) => {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-black bg-[#FFD93D] border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    View All Questions <FaCaretDown className="ml-2" />
                </Menu.Button>
            </div>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none z-10">
                    <div className="px-1 py-1">
                        {questions.map((question) => (
                            <Menu.Item key={question.id}>
                                {({ active }) => (
                                    <Link
                                        to={`/questions/${encryptId(question.id)}?company_id=${encryptId(question.company_id)}`}
                                        className={`${
                                            active ? 'bg-[#FFD93D]' : 'bg-white'
                                        } group flex rounded-md items-center w-full px-3 py-2 text-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all`}
                                    >
                                        {question.title}
                                    </Link>
                                )}
                            </Menu.Item>
                        ))}

                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
};

export default Dropdown; 