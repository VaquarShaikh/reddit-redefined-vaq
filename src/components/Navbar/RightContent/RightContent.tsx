import { Button, Flex } from '@chakra-ui/react';
import { signOut, User } from 'firebase/auth';
import React from 'react';
import { auth } from '../../../firebase/clientApp';
import AuthModal from '../../Modal/Auth/AuthModal';
import Icons from '../Icons';
import AuthButtons from './AuthButtons';
import UserMenu from './UserMenu';

interface RightContentProps {
    user?: User | null
};

const RightContent:React.FC<RightContentProps> = ({user}) => {
    
    return (
        <>
            <AuthModal/>
            <Flex justify='center' align='center'>
                { user? (
                    <Icons/>
                    ) :  (
                    <AuthButtons/>
                    )
                }
                <UserMenu user={user}/>
            </Flex>
        </>
    )
}
export default RightContent;