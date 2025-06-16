import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/response/user-response.dto';

type MockRepo<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;
const createMockRepo = <T extends ObjectLiteral>(): MockRepo<T> => ({
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockRepo<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepo<User>(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<MockRepo<User>>(getRepositoryToken(User));
  });

  describe('findAll', () => {
    it('should return an array of UserResponseDto', async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          nickname: 'test1',
          password: 'h1',
          role: 'student',
        },
      ];
      repo.find!.mockResolvedValue(mockUsers);

      const expected: UserResponseDto[] = [{ id: 1, nickname: 'test1' }];
      await expect(service.findAll()).resolves.toEqual(expected);
      expect(repo.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should hash password, save user, and return UserResponseDto', async () => {
      const dto = { nickname: 'newuser', plainPassword: 'Abc123!@' };

      const genSaltSpy = jest.spyOn(bcrypt, 'genSalt') as jest.Mock;
      genSaltSpy.mockResolvedValue('fake_salt');
      const hashSpy = jest.spyOn(bcrypt, 'hash') as jest.Mock;
      hashSpy.mockResolvedValue('hashed_pass');

      const createdEntity = {
        nickname: dto.nickname,
        password: 'hashed_pass',
      } as unknown as User;
      const savedEntity: User = {
        id: 10,
        nickname: dto.nickname,
        password: 'hashed_pass',
        role: 'student',
      };
      repo.create!.mockReturnValue(createdEntity);
      repo.save!.mockResolvedValue(savedEntity);

      const result = await service.create(dto.nickname, dto.plainPassword);

      expect(genSaltSpy).toHaveBeenCalled();
      expect(hashSpy).toHaveBeenCalledWith(dto.plainPassword, 'fake_salt');
      expect(repo.create).toHaveBeenCalledWith({
        nickname: dto.nickname,
        password: 'hashed_pass',
      });
      expect(repo.save).toHaveBeenCalledWith(createdEntity);

      expect(result).toEqual({ id: 10, nickname: 'newuser' });
    });
  });
});
