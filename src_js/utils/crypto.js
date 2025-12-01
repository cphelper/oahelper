<Link 
                                        key={question.id}
                                        to={`/questions/${encryptId(question.id)}?company_id=${encryptedId}`}
                                        className={`group bg-white p-6 rounded-lg border-2 border-black transition-all duration-200 
                                            ${isQuestionLocked 
                                                ? 'opacity-75 cursor-not-allowed hover:border-red-500' 
                                                : 'hover:border-[#FF6B6B] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                            }`}
                                        onClick={(e) => {
                                            if (isQuestionLocked) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >